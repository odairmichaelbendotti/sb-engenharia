import { DomainError } from "../errors/DomainError.js";

// Quantidades são gravadas em milésimos da unidade (3,5 m² = 3500), como o dinheiro em centavos:
// a comparação "medido = orçado" fica exata
export const QTD_ESCALA = 1000;
// Maior valor de uma coluna Int do Postgres
export const INT_MAX = 2_147_483_647;
export const DESCRICAO_ITEM_MAX = 500;
export const UNIDADE_MAX = 20;
export const CODIGO_ITEM_MAX = 40;
export const ORCAMENTO_ITENS_MAX = 500;

/** Quantidade decimal da API → milésimos. Mais de 3 casas é arredondado. */
export function toMilesimos(quantidade: number): number {
  return Math.round(quantidade * QTD_ESCALA);
}

export function fromMilesimos(milesimos: number): number {
  return milesimos / QTD_ESCALA;
}

/**
 * Valor de uma quantidade de um item, em centavos, arredondado meio para cima.
 * Feito em BigInt: milésimos × centavos passa de 2^53 com valores grandes.
 */
export function valorItem(quantidadeMil: number, precoCent: number): number {
  const produto = BigInt(quantidadeMil) * BigInt(precoCent);
  const escala = BigInt(QTD_ESCALA);
  return Number((produto + escala / 2n) / escala);
}

// Como os preços do orçamento foram informados (OrdemServico.precoBase)
export type PrecoBase = "COM_BDI" | "COM_BDI_E_DESCONTO";
export const PRECO_BASES: readonly PrecoBase[] = ["COM_BDI", "COM_BDI_E_DESCONTO"];

// Desconto em porcentagem com até 4 casas, levado a milionésimos para a conta ser em inteiros
const DESCONTO_ESCALA = 1_000_000;

/**
 * Preço com BDI menos o desconto (porcentagem), truncado no centavo, como nas planilhas de
 * licitação: o preço com desconto nunca passa do referencial. Conta em BigInt, sem ponto flutuante.
 */
export function precoComDesconto(precoCent: number, desconto: number): number {
  const fator = BigInt(DESCONTO_ESCALA - Math.round(desconto * 10_000));
  return Number((BigInt(precoCent) * fator) / BigInt(DESCONTO_ESCALA));
}

// Item da planilha em unidades internas (milésimos e centavos)
export type ItemPlanilha = {
  id: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  // Preço que vale nas medições (com BDI e desconto)
  precoUnitario: number;
  // Total digitado para bater com a planilha de referência; nulo = quantidade × preço
  valorTotal: number | null;
  // Preço com BDI digitado, quando o sistema aplicou o desconto; ausente no snapshot da medição
  precoReferencia?: number | null;
};

type ValoresItem = Pick<ItemPlanilha, "quantidade" | "precoUnitario" | "valorTotal">;

/**
 * Maior diferença aceita entre o total ajustado e quantidade × preço, em centavos: meio centavo
 * por unidade (preço com casas escondidas, ex. BDI × desconto) mais um centavo (total truncado).
 */
export function folgaValorTotal(quantidadeMil: number): number {
  return Math.ceil(quantidadeMil / (2 * QTD_ESCALA)) + 1;
}

/** Valor orçado do item: o total ajustado, ou quantidade × preço. */
export function valorOrcadoItem(item: ValoresItem): number {
  return item.valorTotal ?? valorItem(item.quantidade, item.precoUnitario);
}

/**
 * Valor de uma quantidade acumulada do item. Com total ajustado, o parcial segue quantidade × preço
 * (limitado ao total) e o item medido por inteiro vale o total: a última medição absorve a diferença.
 */
export function valorAcumuladoItem(item: ValoresItem, quantidadeMil: number): number {
  const calculado = valorItem(quantidadeMil, item.precoUnitario);
  if (item.valorTotal === null) return calculado;
  if (quantidadeMil < item.quantidade) return Math.min(calculado, item.valorTotal);
  // Acima do orçado (rascunho lançado antes de o orçamento diminuir) soma o excedente pelo preço
  return item.valorTotal + calculado - valorItem(item.quantidade, item.precoUnitario);
}

// Quantidade por item (milésimos)
export type QuantidadesPorItem = ReadonlyMap<string, number>;

export type PanoramaItem = {
  item_id: string;
  orcado: number;
  valorOrcado: number;
  // Soma das medições fechadas
  medido: number;
  valorMedido: number;
  saldo: number;
  valorSaldo: number;
  // Quantidade no rascunho aberto (não conta no medido)
  rascunho: number;
  // O rascunho passou do saldo (ex.: o orçamento mudou depois que ele foi lançado)
  excedeSaldo: boolean;
  completo: boolean;
};

export type PanoramaTotais = {
  valorOrcado: number;
  valorMedido: number;
  valorSaldo: number;
  valorRascunho: number;
};

/**
 * Orçado, medido e saldo de cada item. Os valores medidos saem da diferença dos valores
 * acumulados, então a soma das medições de um item bate centavo a centavo com o orçado.
 */
export function computePanorama({
  itens,
  medidoFechado,
  rascunho,
}: {
  itens: readonly ItemPlanilha[];
  medidoFechado: QuantidadesPorItem;
  rascunho: QuantidadesPorItem;
}): { itens: PanoramaItem[]; totais: PanoramaTotais } {
  const linhas = itens.map((item): PanoramaItem => {
    const medido = medidoFechado.get(item.id) ?? 0;
    const emRascunho = rascunho.get(item.id) ?? 0;
    const valorOrcado = valorOrcadoItem(item);
    const valorMedido = valorAcumuladoItem(item, medido);
    const saldo = item.quantidade - medido;
    return {
      item_id: item.id,
      orcado: item.quantidade,
      valorOrcado,
      medido,
      valorMedido,
      saldo,
      valorSaldo: valorOrcado - valorMedido,
      rascunho: emRascunho,
      excedeSaldo: emRascunho > saldo,
      completo: saldo <= 0,
    };
  });

  const totais = linhas.reduce<PanoramaTotais>(
    (acc, l, i) => {
      acc.valorOrcado += l.valorOrcado;
      acc.valorMedido += l.valorMedido;
      acc.valorSaldo += l.valorSaldo;
      acc.valorRascunho += valorAcumuladoItem(itens[i]!, l.medido + l.rascunho) - l.valorMedido;
      return acc;
    },
    { valorOrcado: 0, valorMedido: 0, valorSaldo: 0, valorRascunho: 0 },
  );

  return { itens: linhas, totais };
}

export type LinhaMedicao = {
  item_id: string;
  orcado: number;
  // Acumulado das medições fechadas anteriores a esta
  anterior: number;
  esta: number;
  acumulado: number;
  saldo: number;
  valorOrcado: number;
  valorAnterior: number;
  valorEsta: number;
  valorAcumulado: number;
  valorSaldo: number;
};

export type TotaisMedicao = {
  valorOrcado: number;
  valorAnterior: number;
  valorEsta: number;
  valorAcumulado: number;
  valorSaldo: number;
};

/** Planilha de uma medição: anterior, esta, acumulado e saldo de cada item, em quantidade e valor. */
export function computeLinhasMedicao({
  itens,
  anterior,
  esta,
}: {
  itens: readonly ItemPlanilha[];
  anterior: QuantidadesPorItem;
  esta: QuantidadesPorItem;
}): { linhas: LinhaMedicao[]; totais: TotaisMedicao } {
  const linhas = itens.map((item): LinhaMedicao => {
    const qAnterior = anterior.get(item.id) ?? 0;
    const qEsta = esta.get(item.id) ?? 0;
    const acumulado = qAnterior + qEsta;
    const valorOrcado = valorOrcadoItem(item);
    const valorAnterior = valorAcumuladoItem(item, qAnterior);
    const valorAcumulado = valorAcumuladoItem(item, acumulado);
    return {
      item_id: item.id,
      orcado: item.quantidade,
      anterior: qAnterior,
      esta: qEsta,
      acumulado,
      saldo: item.quantidade - acumulado,
      valorOrcado,
      valorAnterior,
      valorEsta: valorAcumulado - valorAnterior,
      valorAcumulado,
      valorSaldo: valorOrcado - valorAcumulado,
    };
  });

  const totais = linhas.reduce<TotaisMedicao>(
    (acc, l) => {
      acc.valorOrcado += l.valorOrcado;
      acc.valorAnterior += l.valorAnterior;
      acc.valorEsta += l.valorEsta;
      acc.valorAcumulado += l.valorAcumulado;
      acc.valorSaldo += l.valorSaldo;
      return acc;
    },
    { valorOrcado: 0, valorAnterior: 0, valorEsta: 0, valorAcumulado: 0, valorSaldo: 0 },
  );

  return { linhas, totais };
}

export type LinhaMedicaoInput = { item_id: string; quantidade: number };

function formatQtd(milesimos: number, unidade: string): string {
  const texto = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(fromMilesimos(milesimos));
  return `${texto} ${unidade}`;
}

/**
 * Confere as quantidades de uma medição contra o saldo de cada item (orçado − medições fechadas).
 * Lança DomainError com o primeiro problema.
 */
export function validateMedicaoQuantidades({
  itens,
  medidoFechado,
  linhas,
}: {
  itens: readonly ItemPlanilha[];
  medidoFechado: QuantidadesPorItem;
  linhas: readonly LinhaMedicaoInput[];
}): void {
  const porId = new Map(itens.map((i) => [i.id, i]));
  const vistos = new Set<string>();
  for (const linha of linhas) {
    const item = porId.get(linha.item_id);
    if (!item) throw new DomainError("Medição has an item that is not in the budget");
    if (vistos.has(item.id)) throw new DomainError(`Item "${item.descricao}" appears twice in the medição`);
    vistos.add(item.id);
    if (!Number.isInteger(linha.quantidade) || linha.quantidade <= 0 || linha.quantidade > INT_MAX) {
      throw new DomainError(`Invalid quantity for item "${item.descricao}"`);
    }
    const saldo = item.quantidade - (medidoFechado.get(item.id) ?? 0);
    if (saldo <= 0) throw new DomainError(`Item "${item.descricao}" is already fully measured`);
    if (linha.quantidade > saldo) {
      throw new DomainError(
        `Quantity for item "${item.descricao}" exceeds the remaining balance (max ${formatQtd(saldo, item.unidade)})`,
      );
    }
  }
}

export type OrcamentoItemInput = {
  // Ausente nos itens novos
  id?: string | undefined;
  codigo: string | null;
  descricao: string;
  unidade: string;
  quantidade: number;
  // Preço que vale (no modo COM_BDI, já calculado com o desconto)
  precoUnitario: number;
  // Total ajustado; nulo = quantidade × preço. Só no modo COM_BDI_E_DESCONTO
  valorTotal: number | null;
  // Preço com BDI digitado (modo COM_BDI); nulo no modo com desconto
  precoReferencia: number | null;
};

/**
 * Confere a planilha nova contra a atual e o que já foi medido em medições fechadas:
 * item medido não sai, não fica abaixo do medido, não muda de preço nem de unidade e o total
 * ajustado não altera o valor já medido.
 * O total ajustado só pode diferir de quantidade × preço dentro da folga (`folgaValorTotal`).
 * Itens só com quantidade em rascunho mudam à vontade (o rascunho é revalidado ao fechar).
 */
export function validateOrcamentoChange({
  atuais,
  novos,
  medidoFechado,
}: {
  atuais: readonly ItemPlanilha[];
  novos: readonly OrcamentoItemInput[];
  medidoFechado: QuantidadesPorItem;
}): void {
  if (novos.length > ORCAMENTO_ITENS_MAX) {
    throw new DomainError(`The budget can have at most ${ORCAMENTO_ITENS_MAX} items`);
  }
  const atuaisPorId = new Map(atuais.map((i) => [i.id, i]));
  const enviados = new Set<string>();

  novos.forEach((novo, index) => {
    const pos = `Item ${index + 1}`;
    if (!novo.descricao) throw new DomainError(`${pos}: descrição is required`);
    if (novo.descricao.length > DESCRICAO_ITEM_MAX) {
      throw new DomainError(`${pos}: descrição must have at most ${DESCRICAO_ITEM_MAX} characters`);
    }
    if (!novo.unidade) throw new DomainError(`${pos}: unidade is required`);
    if (novo.unidade.length > UNIDADE_MAX) {
      throw new DomainError(`${pos}: unidade must have at most ${UNIDADE_MAX} characters`);
    }
    if (novo.codigo && novo.codigo.length > CODIGO_ITEM_MAX) {
      throw new DomainError(`${pos}: código must have at most ${CODIGO_ITEM_MAX} characters`);
    }
    if (!Number.isInteger(novo.quantidade) || novo.quantidade <= 0 || novo.quantidade > INT_MAX) {
      throw new DomainError(`${pos}: quantidade must be greater than zero`);
    }
    if (!Number.isInteger(novo.precoUnitario) || novo.precoUnitario < 0 || novo.precoUnitario > INT_MAX) {
      throw new DomainError(`${pos}: preço unitário is invalid`);
    }
    if (novo.precoReferencia !== null) {
      if (!Number.isInteger(novo.precoReferencia) || novo.precoReferencia < 0 || novo.precoReferencia > INT_MAX) {
        throw new DomainError(`${pos}: preço unitário is invalid`);
      }
      // O total ajustado é da planilha com desconto; aplicando o desconto, o total é sempre calculado
      if (novo.valorTotal !== null) throw new DomainError(`${pos}: valor total can only be adjusted with discounted prices`);
    }
    if (novo.valorTotal !== null) {
      if (!Number.isInteger(novo.valorTotal) || novo.valorTotal < 0 || novo.valorTotal > INT_MAX) {
        throw new DomainError(`${pos}: valor total is invalid`);
      }
      const diferenca = Math.abs(novo.valorTotal - valorItem(novo.quantidade, novo.precoUnitario));
      if (diferenca > folgaValorTotal(novo.quantidade)) {
        throw new DomainError(`${pos}: valor total is too far from quantidade × preço unitário`);
      }
    }

    if (novo.id === undefined) return;
    const atual = atuaisPorId.get(novo.id);
    if (!atual) throw new DomainError(`${pos}: item not found in this budget`);
    if (enviados.has(novo.id)) throw new DomainError(`${pos}: item sent twice`);
    enviados.add(novo.id);

    const medido = medidoFechado.get(novo.id) ?? 0;
    if (medido === 0) return;
    if (novo.quantidade < medido) {
      throw new DomainError(
        `${pos}: quantidade cannot be lower than what was already measured (${formatQtd(medido, atual.unidade)})`,
      );
    }
    if (
      novo.precoUnitario !== atual.precoUnitario ||
      (atual.precoReferencia !== undefined && novo.precoReferencia !== atual.precoReferencia)
    ) {
      throw new DomainError(`${pos}: preço unitário of a measured item cannot change`);
    }
    // O total ajustado pode mudar só se não mexer no valor já medido (ex.: item medido por inteiro)
    if (valorAcumuladoItem(novo, medido) !== valorAcumuladoItem(atual, medido)) {
      throw new DomainError(`${pos}: valor total would change the value already measured`);
    }
    if (novo.unidade !== atual.unidade) {
      throw new DomainError(`${pos}: unidade of a measured item cannot change`);
    }
  });

  for (const atual of atuais) {
    if (!enviados.has(atual.id) && (medidoFechado.get(atual.id) ?? 0) > 0) {
      throw new DomainError(`Item "${atual.descricao}" was already measured and cannot be removed`);
    }
  }
}

/**
 * Totais do orçamento em centavos. O valor da OS é a soma dos itens (preços com desconto). O total
 * com BDI é a soma pelo preço de referência quando o sistema aplicou o desconto; com os preços já
 * descontados, é o valor da OS sem o desconto (arredondado).
 */
export function totaisOrcamento({
  itens,
  precoBase,
  desconto,
}: {
  itens: readonly Pick<ItemPlanilha, "quantidade" | "precoUnitario" | "valorTotal" | "precoReferencia">[];
  precoBase: PrecoBase;
  desconto: number;
}): { totalComBdi: number; valorOs: number } {
  const valorOs = itens.reduce((acc, item) => acc + valorOrcadoItem(item), 0);
  if (precoBase === "COM_BDI") {
    const totalComBdi = itens.reduce(
      (acc, item) => acc + valorItem(item.quantidade, item.precoReferencia ?? item.precoUnitario),
      0,
    );
    return { totalComBdi, valorOs };
  }
  const fator = 1 - desconto / 100;
  return { totalComBdi: fator > 0 ? Math.round(valorOs / fator) : valorOs, valorOs };
}

type ItemComReferencia = Pick<ItemPlanilha, "id" | "quantidade" | "precoUnitario" | "valorTotal" | "precoReferencia">;

/**
 * Preços do orçamento com outro desconto (ex.: a OS antiga recebeu o lote): o item com preço de
 * referência (modo COM_BDI) recebe o desconto de novo; os demais ficam como estão. Devolve os
 * preços que mudaram e o novo valor da OS (centavos).
 */
export function aplicarDesconto(
  itens: readonly ItemComReferencia[],
  desconto: number,
): { precos: { id: string; precoUnitario: number }[]; valorOs: number } {
  const precos: { id: string; precoUnitario: number }[] = [];
  let valorOs = 0;
  for (const item of itens) {
    const precoUnitario =
      item.precoReferencia === null || item.precoReferencia === undefined
        ? item.precoUnitario
        : precoComDesconto(item.precoReferencia, desconto);
    if (precoUnitario !== item.precoUnitario) precos.push({ id: item.id, precoUnitario });
    valorOs += valorOrcadoItem({ ...item, precoUnitario });
  }
  return { precos, valorOs };
}

/**
 * Diferença entre a soma dos itens e o valor da OS (soma dos empenhos), em centavos. Nula quando
 * bate. Salvar o orçamento acerta os empenhos; sobra diferença em OS que ainda não foi salva assim.
 */
export function divergenciaTotal(somaItens: number, valorOs: number): { diferenca: number } | null {
  const diferenca = somaItens - valorOs;
  return diferenca === 0 ? null : { diferenca };
}
