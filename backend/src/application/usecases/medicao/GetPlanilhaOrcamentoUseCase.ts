import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { computePanorama, divergenciaTotal, totaisOrcamento } from "../../../domain/medicao/medicao-calc.js";
import { somarQuantidades } from "../../../domain/medicao/medicao-resumo.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";
import type { IMedicaoRepository } from "../../../domain/repositories/IMedicaoRepository.js";
import { isCienciaDispensada } from "../../../domain/tramitacao/ciencia.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import { loadOsComAcesso, podeEditar } from "./medicao-access.js";
import { presentMedicaoResumo, qtd, reais, valoresDasMedicoes } from "./medicao-presenter.js";

// Por que não dá para lançar uma medição agora (o frontend traduz)
type MotivoBloqueio = "SEM_PERMISSAO" | "OS_INATIVA" | "SEM_ORCAMENTO" | "RASCUNHO_ABERTO" | "SEM_SALDO";

const DIA_MS = 24 * 60 * 60 * 1000;

// Planilha orçamentária da OS com o panorama (orçado, medido, saldo) e as medições
export class GetPlanilhaOrcamentoUseCase {
  constructor(
    private repository: IMedicaoRepository,
    private empenhoRepository: IEmpenhoRepository,
  ) {}

  async execute({ ordemServicoId, user }: { ordemServicoId: string; user: AuthenticatedUser }) {
    const os = await loadOsComAcesso(this.repository, ordemServicoId, user);
    const planilha = await this.repository.getPlanilha(os.id);
    const daEmpresa = user.role === "EMPRESA";

    const fechadas = planilha.medicoes.filter((m) => m.status === "FECHADA");
    const rascunho = planilha.medicoes.find((m) => m.status === "RASCUNHO") ?? null;
    // A empresa não vê o rascunho: é trabalho interno da fiscalização
    const panorama = computePanorama({
      itens: planilha.itens,
      medidoFechado: somarQuantidades(fechadas),
      rascunho: rascunho && !daEmpresa ? somarQuantidades([rascunho]) : new Map(),
    });

    const editor = podeEditar(user) && os.tenant_id === user.tenant_id;
    const motivo: MotivoBloqueio | null = !editor
      ? "SEM_PERMISSAO"
      : os.status !== "ATIVO"
        ? "OS_INATIVA"
        : planilha.itens.length === 0
          ? "SEM_ORCAMENTO"
          : rascunho
            ? "RASCUNHO_ABERTO"
            : panorama.itens.every((i) => i.completo)
              ? "SEM_SALDO"
              : null;

    // Valor da OS = soma dos empenhos; salvar o orçamento acerta os empenhos com a soma dos itens
    const valorOs = os.valor;
    const totais = totaisOrcamento({ itens: planilha.itens, precoBase: os.precoBase, desconto: os.desconto });
    const temFechada = fechadas.length > 0;
    const emiteOs = editor && new DomainAccessPolicy().canDo(user.role, "createOrdemServico");
    // Para distribuir o valor entre os empenhos: o saldo livre de cada um sem contar esta OS
    const empenhos = editor
      ? await Promise.all(
          os.empenhos.map(async (v) => ({
            id: v.empenho_id,
            numero: v.numero,
            valor: reais(v.valor),
            saldoLivre: await this.empenhoRepository.getSaldoDisponivel(v.empenho_id, os.id),
          })),
        )
      : [];
    const divergencia =
      editor && planilha.itens.length > 0 ? divergenciaTotal(panorama.totais.valorOrcado, valorOs) : null;
    const valores = valoresDasMedicoes(planilha);
    const ultimaFechada = fechadas.at(-1);
    // A nota fiscal que paga a medição é dado administrativo; a empresa não vê
    const notas = daEmpresa ? new Map() : await this.repository.findNotasFiscais(fechadas.map((m) => m.id));
    const medicoes = (daEmpresa ? fechadas : planilha.medicoes).map((m) => {
      const notaFiscal = notas.get(m.id) ?? null;
      return {
        ...presentMedicaoResumo(m, valores.get(m.id) ?? 0),
        notaFiscal,
        // Vale para reabrir e para excluir: só a última fechada, sem rascunho aberto e sem nota fiscal
        podeReabrir: editor && os.status === "ATIVO" && !rascunho && m.id === ultimaFechada?.id && !notaFiscal,
      };
    });

    // Sugestão de período da próxima medição: do dia seguinte ao fim da última fechada (ou do início da OS)
    const proximoPeriodoInicio = ultimaFechada
      ? new Date(ultimaFechada.periodoFim.getTime() + DIA_MS)
      : os.dataInicio;

    return {
      ordemServico: {
        id: os.id,
        numero: os.numero,
        status: os.status,
        dataInicio: os.dataInicio,
        dataPrevisaoTermino: os.dataPrevisaoTermino,
        descricaoEmpenho: os.descricaoEmpenho,
        obra: os.obra,
        contrato: os.contrato,
        empresa: os.empresa,
        aguardandoEmissao: os.aguardandoEmissao,
        // Aviso interno: a OS antiga sem lote ficou com desconto 0
        semLote: editor && os.semLote,
      },
      // Como os preços foram informados e o desconto da OS (porcentagem)
      precoBase: os.precoBase,
      desconto: os.desconto,
      totalComBdi: planilha.itens.length > 0 ? reais(totais.totalComBdi) : null,
      empenhos,
      itens: planilha.itens.map((item, index) => {
        const p = panorama.itens[index]!;
        return {
          id: item.id,
          ordem: item.ordem,
          codigo: item.codigo,
          descricao: item.descricao,
          etapa: item.etapa,
          unidade: item.unidade,
          // Contratada; a que vale é ela menos a suprimida
          quantidade: qtd(item.quantidade),
          quantidadeSuprimida: qtd(p.suprimido),
          precoUnitario: reais(item.precoUnitario),
          precoReferencia: item.precoReferencia === null || item.precoReferencia === undefined ? null : reais(item.precoReferencia),
          valorTotal: reais(p.valorOrcado),
          totalAjustado: item.valorTotal !== null,
          medido: qtd(p.medido),
          valorMedido: reais(p.valorMedido),
          saldo: qtd(p.saldo),
          valorSaldo: reais(p.valorSaldo),
          rascunho: qtd(p.rascunho),
          excedeSaldo: p.excedeSaldo,
          completo: p.completo,
        };
      }),
      totais: {
        valorOrcado: reais(panorama.totais.valorOrcado),
        valorMedido: reais(panorama.totais.valorMedido),
        valorSaldo: reais(panorama.totais.valorSaldo),
        valorRascunho: reais(panorama.totais.valorRascunho),
      },
      // A comparação com o valor da OS só serve a quem lança o orçamento
      valorOs: editor ? reais(valorOs) : null,
      divergencia: divergencia && { diferenca: reais(divergencia.diferenca) },
      medicoes,
      proximoPeriodoInicio,
      permissoes: {
        editarOrcamento: editor && os.status === "ATIVO",
        // Trocar o modo mudaria o preço dos itens já medidos
        trocarPrecoBase: editor && os.status === "ATIVO" && !temFechada,
        emitir: emiteOs && os.status === "ATIVO" && os.aguardandoEmissao && planilha.itens.length > 0,
        // Salvar com outro valor reemite a OS para a empresa
        reemiteAoMudarValor:
          os.status === "ATIVO" &&
          !os.aguardandoEmissao &&
          !isCienciaDispensada({ ...os, cienteEm: null, contestacoesAbertas: 0 }),
        criarMedicao: motivo === null,
        editarMedicoes: editor && os.status === "ATIVO",
        motivo,
      },
    };
  }
}
