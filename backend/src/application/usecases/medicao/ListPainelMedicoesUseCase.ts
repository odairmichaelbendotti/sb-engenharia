import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { divergenciaTotal, valorFinalOs } from "../../../domain/medicao/medicao-calc.js";
import { resumirPlanilha } from "../../../domain/medicao/medicao-resumo.js";
import type { IMedicaoRepository } from "../../../domain/repositories/IMedicaoRepository.js";
import { podeEditar } from "./medicao-access.js";
import { reais } from "./medicao-presenter.js";

// Tela de medições: cada OS com a situação do orçamento e das medições. Trabalho da fiscalização,
// então a EMPRESA fica de fora (ela vê as medições fechadas no modal da OS)
export class ListPainelMedicoesUseCase {
  constructor(private repository: IMedicaoRepository) {}

  async execute(user: AuthenticatedUser) {
    if (user.role === "EMPRESA") {
      throw new DomainError("You are not authorized to access the medições panel");
    }

    const ordensServico = await this.repository.listOsDoPainel(
      user.role === "PLATFORM_ADMIN" ? undefined : user.tenant_id,
    );
    const planilhas = await this.repository.getPlanilhas(ordensServico.map((os) => os.id));
    const editor = podeEditar(user);

    return ordensServico.map((os) => {
      const resumo = resumirPlanilha(planilhas.get(os.id) ?? { itens: [], medicoes: [] });
      const valorOs = valorFinalOs(os);
      const podeEditarOs = editor && os.tenant_id === user.tenant_id && os.status === "ATIVO";
      const divergencia = editor && resumo.itens > 0 ? divergenciaTotal(resumo.valorOrcado, valorOs) : null;
      return {
        id: os.id,
        numero: os.numero,
        status: os.status,
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
