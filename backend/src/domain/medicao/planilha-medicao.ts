import {
  computeLinhasMedicao,
  QTD_ESCALA,
  type ItemPlanilha,
  type LinhaMedicao,
  type QuantidadesPorItem,
  type TotaisMedicao,
} from "./medicao-calc.js";

// Item da planilha com os dados de exibição
export type ItemPlanilhaCompleto = ItemPlanilha & { ordem: number; codigo: string | null; etapa: string | null };

/**
 * Planilha de uma medição, em unidades internas (quantidade com 5 casas e centavos). Na fechada é
 * gravada em Medicao.planilhaFechamento, para a reimpressão sair igual à assinada; no rascunho é
 * montada com o orçamento atual. Versão 1 = quantidades em milésimos (gravadas até 2026-10-29),
 * convertidas na leitura; versão 2 = quantidades na escala atual (QTD_ESCALA).
 */
export type PlanilhaMedicao = {
  versao: 2;
  itens: {
    item_id: string;
    ordem: number;
    codigo: string | null;
    descricao: string;
    // Etapa do item; ausente nas planilhas gravadas antes das etapas (= sem etapa)
    etapa?: string | null;
    unidade: string;
    // Quantidade contratada (a efetiva desconta a suprimida)
    orcado: number;
    // Supressão; ausente nas planilhas gravadas antes dela existir (= 0)
    suprimido?: number;
    precoUnitario: number;
    // Total ajustado; ausente nas planilhas gravadas antes dele existir (= quantidade × preço)
    valorTotal?: number | null;
    anterior: number;
    esta: number;
  }[];
  // Fiscais designados na OS quando a medição foi fechada
  fiscais: { tecnico: string | null; administrativo: string | null };
};

export function buildPlanilhaMedicao({
  itens,
  anterior,
  esta,
  fiscais,
}: {
  itens: readonly ItemPlanilhaCompleto[];
  anterior: QuantidadesPorItem;
  esta: QuantidadesPorItem;
  fiscais: PlanilhaMedicao["fiscais"];
}): PlanilhaMedicao {
  return {
    versao: 2,
    itens: [...itens]
      .sort((a, b) => a.ordem - b.ordem)
      .map((item) => ({
        item_id: item.id,
        ordem: item.ordem,
        codigo: item.codigo,
        descricao: item.descricao,
        etapa: item.etapa,
        unidade: item.unidade,
        orcado: item.quantidade,
        suprimido: item.quantidadeSuprimida ?? 0,
        precoUnitario: item.precoUnitario,
        valorTotal: item.valorTotal,
        anterior: anterior.get(item.id) ?? 0,
        esta: esta.get(item.id) ?? 0,
      })),
    fiscais,
  };
}

/**
 * Itens em grupos de etapa, na ordem da planilha: os itens seguidos com a mesma etapa formam um
 * grupo (a mesma etapa mais adiante abre outro). Item sem etapa fica num grupo com etapa nula.
 */
export function gruposPorEtapa<T extends { etapa?: string | null }>(
  itens: readonly T[],
): { etapa: string | null; itens: T[] }[] {
  const grupos: { etapa: string | null; itens: T[] }[] = [];
  for (const item of itens) {
    const etapa = item.etapa ?? null;
    const atual = grupos.at(-1);
    if (atual && atual.etapa === etapa) atual.itens.push(item);
    else grupos.push({ etapa, itens: [item] });
  }
  return grupos;
}

// Versão 1 gravava as quantidades em milésimos: × 100 leva à escala atual (5 casas)
const FATOR_VERSAO_1 = QTD_ESCALA / 1000;

/** Lê a planilha gravada no banco (JSON), recusando um formato desconhecido. */
export function parsePlanilhaMedicao(json: unknown): PlanilhaMedicao | null {
  if (!json || typeof json !== "object") return null;
  const planilha = json as { versao?: unknown; itens?: unknown; fiscais?: unknown };
  if (!Array.isArray(planilha.itens) || !planilha.fiscais) return null;
  if (planilha.versao === 2) return planilha as PlanilhaMedicao;
  if (planilha.versao !== 1) return null;
  const antiga = planilha as Omit<PlanilhaMedicao, "versao"> & { versao: 1 };
  return {
    ...antiga,
    versao: 2,
    itens: antiga.itens.map((i) => ({
      ...i,
      orcado: i.orcado * FATOR_VERSAO_1,
      ...(i.suprimido !== undefined ? { suprimido: i.suprimido * FATOR_VERSAO_1 } : {}),
      anterior: i.anterior * FATOR_VERSAO_1,
      esta: i.esta * FATOR_VERSAO_1,
    })),
  };
}

export type LinhaPlanilhaMedicao = LinhaMedicao & {
  ordem: number;
  codigo: string | null;
  descricao: string;
  etapa: string | null;
  unidade: string;
  precoUnitario: number;
};

/** Linhas calculadas (acumulado, saldo e valores) de uma planilha de medição. */
export function calcularPlanilhaMedicao(planilha: PlanilhaMedicao): {
  linhas: LinhaPlanilhaMedicao[];
  totais: TotaisMedicao;
} {
  const itens: ItemPlanilha[] = planilha.itens.map((i) => ({
    id: i.item_id,
    descricao: i.descricao,
    unidade: i.unidade,
    quantidade: i.orcado,
    quantidadeSuprimida: i.suprimido ?? 0,
    precoUnitario: i.precoUnitario,
    valorTotal: i.valorTotal ?? null,
  }));
  const { linhas, totais } = computeLinhasMedicao({
    itens,
    anterior: new Map(planilha.itens.map((i) => [i.item_id, i.anterior])),
    esta: new Map(planilha.itens.map((i) => [i.item_id, i.esta])),
  });
  return {
    linhas: linhas.map((linha, index) => {
      const item = planilha.itens[index]!;
      return {
        ...linha,
        ordem: item.ordem,
        codigo: item.codigo,
        descricao: item.descricao,
        etapa: item.etapa ?? null,
        unidade: item.unidade,
        precoUnitario: item.precoUnitario,
      };
    }),
    totais,
  };
}
