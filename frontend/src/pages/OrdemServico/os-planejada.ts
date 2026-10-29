import type { OrdemServico } from "../../../types/ordem-servico";

// Espelha backend/src/domain/ordem-servico/os-planejada.ts (mudou lá, mudar aqui). OS planejada =
// criada e ainda não emitida: tem só um valor estimado e não entra no emitido (totais, saldo livre
// dos empenhos, valor da obra) até ser emitida com orçamento

/** A OS conta como emitida (entra nos totais)? */
export function isEmitida(os: Pick<OrdemServico, "aguardandoEmissao">): boolean {
  return !os.aguardandoEmissao;
}

/** OS planejada: ativa e ainda não emitida. */
export function isPlanejada(os: Pick<OrdemServico, "status" | "aguardandoEmissao">): boolean {
  return os.status === "ATIVO" && os.aguardandoEmissao;
}

/** De onde vem o valor planejado: o orçamento lançado, a estimativa digitada ou nada ainda. */
export function origemPlanejado(
  os: Pick<OrdemServico, "temOrcamento" | "estimativaComBdi">,
): "orcado" | "estimado" | "sem valor" {
  if (os.temOrcamento) return "orcado";
  return os.estimativaComBdi !== null ? "estimado" : "sem valor";
}
