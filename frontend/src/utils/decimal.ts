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

/**
 * Maior diferença aceita entre o total ajustado e quantidade × preço, em reais: meio centavo por
 * unidade (preço com casas escondidas) mais um centavo (total truncado). Espelha `folgaValorTotal`
 * de backend/src/domain/medicao/medicao-calc.ts.
 */
export function folgaValorTotal(quantidade: number) {
  return (Math.ceil(Math.round(quantidade * 1000) / 2000) + 1) / 100;
}

/**
 * Valor em reais de uma quantidade acumulada de um item (espelha `valorAcumuladoItem` do backend):
 * o parcial é quantidade × preço limitado ao total do item, e o item medido por inteiro vale o
 * total (que pode ser o ajustado). Sem ajuste, o total é o próprio quantidade × preço e dá no mesmo.
 */
export function valorAcumuladoItem(
  item: { orcado: number; precoUnitario: number; valorOrcado: number },
  quantidade: number,
) {
  const calculado = valorItem(quantidade, item.precoUnitario);
  const mil = Math.round(quantidade * 1000);
  const orcadoMil = Math.round(item.orcado * 1000);
  if (mil < orcadoMil) return Math.min(calculado, item.valorOrcado);
  return Math.round((item.valorOrcado + calculado - valorItem(item.orcado, item.precoUnitario)) * 100) / 100;
}
