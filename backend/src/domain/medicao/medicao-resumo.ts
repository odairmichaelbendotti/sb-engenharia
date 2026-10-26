import { computeLinhasMedicao, computePanorama, type ItemPlanilha, type LinhaMedicaoInput } from "./medicao-calc.js";

// Medição com o mínimo para resumir a planilha (quantidades em milésimos)
type MedicaoDoResumo = {
  id: string;
  numero: number;
  status: "RASCUNHO" | "FECHADA";
  periodoFim: Date;
  itens: readonly LinhaMedicaoInput[];
};

/** Soma por item das quantidades das medições informadas. */
export function somarQuantidades(medicoes: readonly { itens: readonly LinhaMedicaoInput[] }[]): Map<string, number> {
  const soma = new Map<string, number>();
  for (const medicao of medicoes) {
    for (const linha of medicao.itens) soma.set(linha.item_id, (soma.get(linha.item_id) ?? 0) + linha.quantidade);
  }
  return soma;
}

export type ResumoPlanilha = {
  itens: number;
  valorOrcado: number;
  // Só medições fechadas
  valorMedido: number;
  // Todos os itens medidos até o fim (falso sem orçamento)
  completo: boolean;
  rascunho: { id: string; numero: number; valor: number } | null;
  ultimaFechada: { id: string; numero: number; periodoFim: Date } | null;
};

/**
 * Situação do orçamento e das medições de uma OS, para listas e painéis (valores em centavos).
 * Mesmas contas do panorama da planilha: o medido sai das fechadas e o rascunho fica à parte.
 */
export function resumirPlanilha({
  itens,
  medicoes,
}: {
  itens: readonly ItemPlanilha[];
  // Em ordem de número
  medicoes: readonly MedicaoDoResumo[];
}): ResumoPlanilha {
  const fechadas = medicoes.filter((m) => m.status === "FECHADA");
  const rascunho = medicoes.find((m) => m.status === "RASCUNHO") ?? null;
  const medidoFechado = somarQuantidades(fechadas);
  const panorama = computePanorama({ itens, medidoFechado, rascunho: new Map() });
  const ultimaFechada = fechadas.at(-1);

  return {
    itens: itens.length,
    valorOrcado: panorama.totais.valorOrcado,
    valorMedido: panorama.totais.valorMedido,
    completo: itens.length > 0 && panorama.itens.every((i) => i.completo),
    rascunho: rascunho && {
      id: rascunho.id,
      numero: rascunho.numero,
      valor: computeLinhasMedicao({
        itens,
        anterior: medidoFechado,
        esta: new Map(rascunho.itens.map((l) => [l.item_id, l.quantidade])),
      }).totais.valorEsta,
    },
    ultimaFechada: ultimaFechada
      ? { id: ultimaFechada.id, numero: ultimaFechada.numero, periodoFim: ultimaFechada.periodoFim }
      : null,
  };
}
