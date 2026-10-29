import type { RegraDesconto } from "../../types/medicao";

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

/**
 * Quantidade que vale no orçamento: a contratada menos a suprimida (espelha `quantidadeEfetiva` do
 * backend). Conta em milésimos para não sobrar resto de ponto flutuante.
 */
export function quantidadeEfetiva(item: { quantidade: number; quantidadeSuprimida: number }) {
  return (Math.round(item.quantidade * 1000) - Math.round(item.quantidadeSuprimida * 1000)) / 1000;
}

/**
 * Preço com BDI menos o desconto (porcentagem), espelha `precoComDesconto` de
 * backend/src/domain/medicao/medicao-calc.ts (conta em inteiros, desconto com até 4 casas).
 * SIMPLES arredonda o preço com desconto (só referência da medição parcial); SCOAM trunca o valor
 * do desconto.
 */
export function precoComDesconto(preco: number, desconto: number, regra: RegraDesconto = "SIMPLES") {
  const descontoMilionesimos = BigInt(Math.round(desconto * 10_000));
  const centavos = BigInt(Math.round(preco * 100));
  if (regra === "SCOAM") return Number(centavos - (centavos * descontoMilionesimos) / 1_000_000n) / 100;
  return Number((centavos * (1_000_000n - descontoMilionesimos) + 500_000n) / 1_000_000n) / 100;
}

/**
 * Total com desconto do item lançado com BDI (espelha `totalPorRegra`/`totalLinhaComDesconto` do
 * backend). SIMPLES: quantidade × preço c/ BDI × (1 − desconto), arredondado só no fim (como a
 * planilha: 235 × 0,82 × 0,694 = 133,73). SCOAM: quantidade × preço com desconto, truncado. Item com
 * supressão não tem total ajustado: quantidade × preço com desconto, arredondado.
 */
export function totalPorRegra(
  quantidade: number,
  precoComBdi: number,
  desconto: number,
  regra: RegraDesconto,
  suprimida = 0,
) {
  const unitario = precoComDesconto(precoComBdi, desconto, regra);
  if (suprimida > 0) return valorItem(quantidade, unitario);
  const milesimos = BigInt(Math.round(quantidade * 1000));
  if (regra === "SCOAM") return Number((milesimos * BigInt(Math.round(unitario * 100))) / 1000n) / 100;
  const fator = 1_000_000n - BigInt(Math.round(desconto * 10_000));
  const divisor = 1_000_000_000n;
  return Number((milesimos * BigInt(Math.round(precoComBdi * 100)) * fator + divisor / 2n) / divisor) / 100;
}

/**
 * Total com BDI do item (espelha `totaisOrcamento` do backend): quantidade efetiva × preço com BDI,
 * truncado na regra SCOAM (como a planilha) e arredondado na simples.
 */
export function totalComBdiItem(quantidade: number, precoComBdi: number, regra: RegraDesconto) {
  if (regra !== "SCOAM") return valorItem(quantidade, precoComBdi);
  const produto = BigInt(Math.round(quantidade * 1000)) * BigInt(Math.round(precoComBdi * 100));
  return Number(produto / 1000n) / 100;
}

/**
 * Valor do orçamento em reais com outro desconto (espelha `aplicarDesconto` do backend): o item com
 * preço de referência (lançado só com BDI) recebe o desconto; os demais valem o total que já têm.
 */
export function valorOrcamentoComDesconto(
  itens: readonly { quantidade: number; quantidadeSuprimida: number; precoReferencia: number | null; valorTotal: number }[],
  desconto: number,
  regra: RegraDesconto,
) {
  const centavos = itens.reduce((acc, item) => {
    const valor =
      item.precoReferencia === null
        ? item.valorTotal
        : totalPorRegra(quantidadeEfetiva(item), item.precoReferencia, desconto, regra, item.quantidadeSuprimida);
    return acc + Math.round(valor * 100);
  }, 0);
  return centavos / 100;
}
