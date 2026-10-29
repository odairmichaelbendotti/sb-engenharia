import type { RegraDesconto } from "../../types/medicao";

// Números digitados com vírgula (pt-BR) e as contas de quantidade × preço das medições.
// Quantidade: a conta usa 5 casas (como as planilhas e o backend, QTD_ESCALA); a tela mostra 2.

export const QTD_CASAS = 5;
const QTD_ESCALA = 100_000;
const QTD_ESCALA_N = 100_000n;

/** Quantidade em unidade interna (inteiro com 5 casas), sem o resto do ponto flutuante. */
export function qtdInterna(quantidade: number) {
  return Math.round(Number((quantidade * QTD_ESCALA).toFixed(2)));
}

/** Quantidade arredondada nas 5 casas da conta. */
export function arredondaQtd(quantidade: number) {
  return qtdInterna(quantidade) / QTD_ESCALA;
}

/** Número digitado com vírgula ("24,8") → número */
export function parseDecimal(value: string) {
  return parseFloat(value.replace(",", "."));
}

export function toDecimalInput(value: number) {
  return String(value).replace(".", ",");
}

/** Filtra a digitação: só dígitos e uma vírgula, com no máximo `casas` decimais. */
export function sanitizeDecimalInput(text: string, casas = QTD_CASAS) {
  const limpo = text.replace(/\./g, ",").replace(/[^\d,]/g, "");
  const [inteiro = "", ...resto] = limpo.split(",");
  if (resto.length === 0) return inteiro;
  return `${inteiro},${resto.join("").slice(0, casas)}`;
}

/** Quantidade digitada → número com até 5 casas; null se vazia ou inválida. */
export function parseQuantidade(text: string): number | null {
  if (!text.trim()) return null;
  const valor = parseDecimal(text);
  return Number.isFinite(valor) ? arredondaQtd(valor) : null;
}

const quantidadeFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Sempre 2 casas na tela (a conta usa 5): 3.5 → "3,50"; 10.44736 → "10,45" (igual ao PDF) */
export function formatQuantidade(valor: number) {
  return quantidadeFormat.format(valor);
}

/**
 * Valor em reais de uma quantidade de um item, arredondado ao centavo como no backend
 * (espelha `valorItem` de backend/src/domain/medicao/medicao-calc.ts: quantidade interna × centavos).
 */
export function valorItem(quantidade: number, precoUnitario: number) {
  const produto = BigInt(qtdInterna(quantidade)) * BigInt(Math.round(precoUnitario * 100));
  return Number((produto + QTD_ESCALA_N / 2n) / QTD_ESCALA_N) / 100;
}

/** Quantidade × preço truncado no centavo (espelha `valorItemTruncado` do backend). */
function valorItemTruncado(quantidade: number, preco: number) {
  return Number((BigInt(qtdInterna(quantidade)) * BigInt(Math.round(preco * 100))) / QTD_ESCALA_N) / 100;
}

/**
 * Maior diferença aceita entre o total ajustado e quantidade × preço, em reais: meio centavo por
 * unidade (preço com casas escondidas) mais um centavo (total truncado). Espelha `folgaValorTotal`
 * de backend/src/domain/medicao/medicao-calc.ts.
 */
export function folgaValorTotal(quantidade: number) {
  return (Math.ceil(qtdInterna(quantidade) / (2 * QTD_ESCALA)) + 1) / 100;
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
  if (qtdInterna(quantidade) < qtdInterna(item.orcado)) return Math.min(calculado, item.valorOrcado);
  return Math.round((item.valorOrcado + calculado - valorItem(item.orcado, item.precoUnitario)) * 100) / 100;
}

/**
 * Quantidade que vale no orçamento: a contratada menos a suprimida (espelha `quantidadeEfetiva` do
 * backend). Conta na unidade interna para não sobrar resto de ponto flutuante.
 */
export function quantidadeEfetiva(item: { quantidade: number; quantidadeSuprimida: number }) {
  return (qtdInterna(item.quantidade) - qtdInterna(item.quantidadeSuprimida)) / QTD_ESCALA;
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
 * backend). SIMPLES: total com BDI da linha (truncado) × (1 − desconto), arredondado no centavo (como
 * a planilha: 235 × 0,82 = 192,70 × 0,694 = 133,73). SCOAM: quantidade × preço com desconto,
 * truncado. Item com supressão não tem total ajustado: quantidade × preço com desconto, arredondado.
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
  if (regra === "SCOAM") return valorItemTruncado(quantidade, unitario);
  const totalComBdi = BigInt(Math.round(valorItemTruncado(quantidade, precoComBdi) * 100));
  const fator = 1_000_000n - BigInt(Math.round(desconto * 10_000));
  return Number((totalComBdi * fator + 500_000n) / 1_000_000n) / 100;
}

/**
 * Total com BDI do item (espelha `totaisOrcamento` do backend): quantidade efetiva × preço com BDI,
 * truncado no centavo, como a planilha.
 */
export function totalComBdiItem(quantidade: number, precoComBdi: number) {
  return valorItemTruncado(quantidade, precoComBdi);
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
