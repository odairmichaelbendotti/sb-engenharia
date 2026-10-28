import { useState } from "react";

export type GrupoEtapa<T> = {
  // Identifica o grupo na tela (a mesma etapa pode voltar mais adiante na planilha)
  key: string;
  etapa: string | null;
  itens: T[];
};

/**
 * Itens em grupos de etapa, na ordem da planilha (espelha `gruposPorEtapa` de
 * backend/src/domain/medicao/planilha-medicao.ts): itens seguidos com a mesma etapa formam um
 * grupo; item sem etapa fica num grupo com etapa nula.
 */
export function gruposPorEtapa<T>(itens: readonly T[], etapaDe: (item: T) => string | null): GrupoEtapa<T>[] {
  const grupos: GrupoEtapa<T>[] = [];
  for (const item of itens) {
    const etapa = etapaDe(item) || null;
    const atual = grupos.at(-1);
    if (atual && atual.etapa === etapa) atual.itens.push(item);
    else grupos.push({ key: `${grupos.length}:${etapa ?? ""}`, etapa, itens: [item] });
  }
  return grupos;
}

// Orçamento sem etapa nenhuma continua como lista única, sem faixa
export function temEtapas<T>(grupos: readonly GrupoEtapa<T>[]) {
  return grupos.some((g) => g.etapa !== null);
}

export const SEM_ETAPA = "Sem etapa";

export function contagemItens(n: number) {
  return `${n} ${n === 1 ? "item" : "itens"}`;
}

/**
 * Quais etapas estão recolhidas (todas começam abertas). Com busca ou filtro, as etapas abrem
 * sozinhas para o resultado aparecer: `forcarAbertas`.
 */
export function useEtapasRecolhidas(forcarAbertas = false) {
  const [recolhidas, setRecolhidas] = useState<ReadonlySet<string>>(() => new Set());
  const aberta = (key: string) => forcarAbertas || !recolhidas.has(key);
  const alternar = (key: string) =>
    setRecolhidas((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const abrir = (key: string) =>
    setRecolhidas((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  return { aberta, alternar, abrir };
}
