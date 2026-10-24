// Números digitados com vírgula (pt-BR) e as contas de quantidade × preço das medições

/** Número digitado com vírgula ("24,8") → número */
export function parseDecimal(value: string) {
  return parseFloat(value.replace(",", "."));
}

export function toDecimalInput(value: number) {
  return String(value).replace(".", ",");
}

/** Filtra a digitação: só dígitos e uma vírgula, com no máximo `casas` decimais. */
export function sanitizeDecimalInput(text: string, casas = 3) {
  const limpo = text.replace(/\./g, ",").replace(/[^\d,]/g, "");
  const [inteiro = "", ...resto] = limpo.split(",");
  if (resto.length === 0) return inteiro;
  return `${inteiro},${resto.join("").slice(0, casas)}`;
}

/** Quantidade digitada → número com até 3 casas; null se vazia ou inválida. */
export function parseQuantidade(text: string): number | null {
  if (!text.trim()) return null;
  const valor = parseDecimal(text);
  return Number.isFinite(valor) ? Math.round(valor * 1000) / 1000 : null;
}

const quantidadeFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 });

/** 3.5 → "3,50"; 3.125 → "3,125" (mesmo formato do PDF da medição) */
export function formatQuantidade(valor: number) {
  return quantidadeFormat.format(valor);
}

/**
 * Valor em reais de uma quantidade de um item, arredondado ao centavo como no backend
 * (espelha `valorItem` de backend/src/domain/medicao/medicao-calc.ts: milésimos × centavos).
 */
export function valorItem(quantidade: number, precoUnitario: number) {
  const produto = BigInt(Math.round(quantidade * 1000)) * BigInt(Math.round(precoUnitario * 100));
  return Number((produto + 500n) / 1000n) / 100;
}
