import {
  computeLinhasMedicao,
  type ItemPlanilha,
  type LinhaMedicao,
  type QuantidadesPorItem,
  type TotaisMedicao,
} from "./medicao-calc.js";

// Item da planilha com os dados de exibição
export type ItemPlanilhaCompleto = ItemPlanilha & { ordem: number; codigo: string | null; etapa: string | null };

/**
 * Planilha de uma medição, em unidades internas (milésimos e centavos). Na fechada é gravada
 * em Medicao.planilhaFechamento, para a reimpressão sair igual à assinada; no rascunho é
 * montada com o orçamento atual.
 */
export type PlanilhaMedicao = {
  versao: 1;
  itens: {
    item_id: string;
    ordem: number;
    codigo: string | null;
    descricao: string;
    // Etapa do item; ausente nas planilhas gravadas antes das etapas (= sem etapa)
    etapa?: string | null;
    unidade: string;
    orcado: number;
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
    versao: 1,
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

/** Lê a planilha gravada no banco (JSON), recusando um formato desconhecido. */
export function parsePlanilhaMedicao(json: unknown): PlanilhaMedicao | null {
  if (!json || typeof json !== "object") return null;
  const planilha = json as Partial<PlanilhaMedicao>;
  if (planilha.versao !== 1 || !Array.isArray(planilha.itens) || !planilha.fiscais) return null;
  return planilha as PlanilhaMedicao;
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
