import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";
import { create } from "zustand";

// Recorte compartilhado entre NF, OS e Obras: empresa, contrato e empenho
export type ScopeFilter = { empresa: string; contrato: string; empenho: string };

export const EMPTY_SCOPE: ScopeFilter = { empresa: "", contrato: "", empenho: "" };

const SCOPE_KEYS = ["empresa", "contrato", "empenho"] as const;

// Fica guardado ao trocar de página pela sidebar
const useScopeStore = create<{ scope: ScopeFilter; setScope: (scope: ScopeFilter) => void }>((set) => ({
  scope: EMPTY_SCOPE,
  setScope: (scope) => set({ scope }),
}));

/**
 * Filtros de empresa/contrato/empenho compartilhados entre as listagens. Os parâmetros da URL
 * (`?empresa=`, `?contrato=`, `?empenho=`) têm prioridade (link compartilhado); sem eles, vale
 * o último recorte escolhido em qualquer listagem.
 */
export function useScopeFilter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { scope: stored, setScope } = useScopeStore();

  const urlEmpresa = searchParams.get("empresa");
  const urlContrato = searchParams.get("contrato");
  const urlEmpenho = searchParams.get("empenho");
  const hasUrl = urlEmpresa !== null || urlContrato !== null || urlEmpenho !== null;

  const scope = useMemo<ScopeFilter>(
    () => (hasUrl ? { empresa: urlEmpresa ?? "", contrato: urlContrato ?? "", empenho: urlEmpenho ?? "" } : stored),
    [hasUrl, urlEmpresa, urlContrato, urlEmpenho, stored],
  );

  // Depende só das strings da URL: depender do objeto faria um laço com o store
  useEffect(() => {
    if (hasUrl) setScope({ empresa: urlEmpresa ?? "", contrato: urlContrato ?? "", empenho: urlEmpenho ?? "" });
  }, [hasUrl, urlEmpresa, urlContrato, urlEmpenho, setScope]);

  const updateScope = useCallback(
    (patch: Partial<ScopeFilter>) => {
      const next = { ...scope, ...patch };
      setScope(next);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          for (const key of SCOPE_KEYS) {
            if (next[key]) params.set(key, next[key]);
            else params.delete(key);
          }
          return params;
        },
        { replace: true },
      );
    },
    [scope, setScope, setSearchParams],
  );

  return [scope, updateScope] as const;
}
