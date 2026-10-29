/** Endereço da planilha orçamentária da OS (tela Medições). */
export function orcamentoHref(ordemServicoId: string) {
  return `/medicoes/${ordemServicoId}/orcamento`;
}

/** Abre a planilha orçamentária da OS em uma aba nova. */
export function abrirOrcamento(ordemServicoId: string) {
  window.open(orcamentoHref(ordemServicoId), "_blank", "noopener");
}
