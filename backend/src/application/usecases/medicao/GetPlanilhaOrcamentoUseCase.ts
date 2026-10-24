import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { computePanorama, divergenciaTotal, valorFinalOs } from "../../../domain/medicao/medicao-calc.js";
import type { IMedicaoRepository } from "../../../domain/repositories/IMedicaoRepository.js";
import { loadOsComAcesso, podeEditar } from "./medicao-access.js";
import { presentMedicaoResumo, qtd, reais, valoresDasMedicoes } from "./medicao-presenter.js";

// Por que não dá para lançar uma medição agora (o frontend traduz)
type MotivoBloqueio = "SEM_PERMISSAO" | "OS_INATIVA" | "SEM_ORCAMENTO" | "RASCUNHO_ABERTO" | "SEM_SALDO";

const DIA_MS = 24 * 60 * 60 * 1000;

// Planilha orçamentária da OS com o panorama (orçado, medido, saldo) e as medições
export class GetPlanilhaOrcamentoUseCase {
  constructor(private repository: IMedicaoRepository) {}

  async execute({ ordemServicoId, user }: { ordemServicoId: string; user: AuthenticatedUser }) {
    const os = await loadOsComAcesso(this.repository, ordemServicoId, user);
    const planilha = await this.repository.getPlanilha(os.id);
    const daEmpresa = user.role === "EMPRESA";

    const fechadas = planilha.medicoes.filter((m) => m.status === "FECHADA");
    const rascunho = planilha.medicoes.find((m) => m.status === "RASCUNHO") ?? null;
    const somar = (medicoes: typeof planilha.medicoes) => {
      const soma = new Map<string, number>();
      for (const m of medicoes) for (const l of m.itens) soma.set(l.item_id, (soma.get(l.item_id) ?? 0) + l.quantidade);
      return soma;
    };
    // A empresa não vê o rascunho: é trabalho interno da fiscalização
    const panorama = computePanorama({
      itens: planilha.itens,
      medidoFechado: somar(fechadas),
      rascunho: rascunho && !daEmpresa ? somar([rascunho]) : new Map(),
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

    const valorOs = valorFinalOs(os);
    const divergencia =
      editor && planilha.itens.length > 0 ? divergenciaTotal(panorama.totais.valorOrcado, valorOs) : null;
    const valores = valoresDasMedicoes(planilha);
    const ultimaFechada = fechadas.at(-1);
    const medicoes = (daEmpresa ? fechadas : planilha.medicoes).map((m) => ({
      ...presentMedicaoResumo(m, valores.get(m.id) ?? 0),
      podeReabrir: editor && os.status === "ATIVO" && !rascunho && m.id === ultimaFechada?.id,
    }));

    // Sugestão de período da próxima medição: do dia seguinte ao fim da última fechada (ou do início da OS)
    const proximoPeriodoInicio = ultimaFechada
      ? new Date(ultimaFechada.periodoFim.getTime() + DIA_MS)
      : os.dataInicio;

    return {
      ordemServico: { id: os.id, numero: os.numero, status: os.status },
      itens: planilha.itens.map((item, index) => {
        const p = panorama.itens[index]!;
        return {
          id: item.id,
          ordem: item.ordem,
          codigo: item.codigo,
          descricao: item.descricao,
          unidade: item.unidade,
          quantidade: qtd(item.quantidade),
          precoUnitario: reais(item.precoUnitario),
          valorTotal: reais(p.valorOrcado),
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
        criarMedicao: motivo === null,
        editarMedicoes: editor && os.status === "ATIVO",
        motivo,
      },
    };
  }
}
