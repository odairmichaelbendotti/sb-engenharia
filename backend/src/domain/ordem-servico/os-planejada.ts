// OS planejada: criada e ainda não emitida (aguardandoEmissao). Tem um valor estimado, digitado ou
// do orçamento vinculado, e não entra no emitido (totais, comprometido e saldo livre do empenho)

// Desconto em porcentagem com até 4 casas, levado a milionésimos para a conta ser em inteiros
const DESCONTO_ESCALA = 1_000_000;

/** A OS conta como emitida (entra nos totais e reserva o saldo do empenho)? */
export function isEmitida(os: { aguardandoEmissao: boolean }): boolean {
  return !os.aguardandoEmissao;
}

/** OS planejada: ativa e ainda não emitida. */
export function isPlanejada(os: { status: string; aguardandoEmissao: boolean }): boolean {
  return os.status === "ATIVO" && os.aguardandoEmissao;
}

/**
 * Valor da estimativa: o total com BDI digitado com o desconto do lote, arredondado no centavo
 * (centavos; nulo sem estimativa). Ex.: 10.000,00 com 24,8% = 7.520,00.
 */
export function valorEstimado(estimativaComBdi: number | null, desconto: number): number | null {
  if (estimativaComBdi === null) return null;
  const fator = BigInt(DESCONTO_ESCALA - Math.round(desconto * 10_000));
  const escala = BigInt(DESCONTO_ESCALA);
  return Number((BigInt(estimativaComBdi) * fator + escala / 2n) / escala);
}

/**
 * Valor planejado da OS (centavos): o orçado quando há orçamento; sem ele, a estimativa; sem os
 * dois, zero. A estimativa continua guardada depois do orçamento, como histórico.
 */
export function valorPlanejado({
  orcado,
  estimativaComBdi,
  desconto,
}: {
  orcado: number | null;
  estimativaComBdi: number | null;
  desconto: number;
}): number {
  return orcado ?? valorEstimado(estimativaComBdi, desconto) ?? 0;
}
