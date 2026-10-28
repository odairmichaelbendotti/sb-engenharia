import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { divergenciaTotal } from "../../../domain/medicao/medicao-calc.js";
import { resumirPlanilha } from "../../../domain/medicao/medicao-resumo.js";
import type { IMedicaoRepository } from "../../../domain/repositories/IMedicaoRepository.js";
import { podeEditar } from "./medicao-access.js";
import { reais } from "./medicao-presenter.js";

// Tela de medições: cada OS com a situação do orçamento e das medições. A EMPRESA só consulta as OS
// dos próprios contratos e não vê o rascunho (trabalho interno da fiscalização)
export class ListPainelMedicoesUseCase {
  constructor(private repository: IMedicaoRepository) {}

  async execute(user: AuthenticatedUser) {
    const daEmpresa = user.role === "EMPRESA";
    if (daEmpresa && !user.company_id) {
      throw new DomainError("This user is not linked to a company");
    }

    const ordensServico = await this.repository.listOsDoPainel({
      tenant_id: user.role === "PLATFORM_ADMIN" ? undefined : user.tenant_id,
      company_id: daEmpresa ? user.company_id! : undefined,
    });
    const planilhas = await this.repository.getPlanilhas(ordensServico.map((os) => os.id));
    const editor = podeEditar(user);

    return ordensServico.map((os) => {
      const planilha = planilhas.get(os.id) ?? { itens: [], medicoes: [] };
      const resumo = resumirPlanilha(
        daEmpresa ? { ...planilha, medicoes: planilha.medicoes.filter((m) => m.status === "FECHADA") } : planilha,
      );
      const valorOs = os.valor;
      const podeEditarOs = editor && os.tenant_id === user.tenant_id && os.status === "ATIVO";
      const divergencia = editor && resumo.itens > 0 ? divergenciaTotal(resumo.valorOrcado, valorOs) : null;
      return {
        id: os.id,
        numero: os.numero,
        status: os.status,
        aguardandoEmissao: os.aguardandoEmissao,
        // Aviso interno: a OS antiga sem lote ficou com desconto 0
        semLote: editor && os.semLote,
        dataInicio: os.dataInicio,
        dataPrevisaoTermino: os.dataPrevisaoTermino,
        descricaoEmpenho: os.descricaoEmpenho,
        obra: os.obra,
        contrato: os.contrato,
        empresa: os.empresa,
        empenhos: os.empenhos,
        valorOs: reais(valorOs),
        itens: resumo.itens,
        valorOrcado: reais(resumo.valorOrcado),
        valorMedido: reais(resumo.valorMedido),
        completo: resumo.completo,
        rascunho: resumo.rascunho && { ...resumo.rascunho, valor: reais(resumo.rascunho.valor) },
        ultimaFechada: resumo.ultimaFechada,
        divergencia: divergencia && { diferenca: reais(divergencia.diferenca) },
        podeEditar: podeEditarOs,
      };
    });
  }
}
