import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router";
import { create } from "zustand";

// Empenho escolhido vale para NF, OS e Obras: fica guardado ao trocar de página pela sidebar
const useEmpenhoFilterStore = create<{ empenhoId: string; setEmpenhoId: (id: string) => void }>((set) => ({
  empenhoId: "",
  setEmpenhoId: (empenhoId) => set({ empenhoId }),
}));

/**
 * Filtro de empenho compartilhado entre as listagens. `?empenho=<id>` na URL tem prioridade
 * (link compartilhado); sem ele, vale o último empenho escolhido em qualquer listagem.
 */
export function useEmpenhoFilter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { empenhoId: stored, setEmpenhoId } = useEmpenhoFilterStore();
  const fromUrl = searchParams.get("empenho");

  useEffect(() => {
    if (fromUrl !== null) setEmpenhoId(fromUrl);
  }, [fromUrl, setEmpenhoId]);

  const setEmpenho = useCallback(
    (id: string) => {
      setEmpenhoId(id);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id) next.set("empenho", id);
          else next.delete("empenho");
          return next;
        },
        { replace: true },
      );
    },
    [setEmpenhoId, setSearchParams],
  );

  return [fromUrl ?? stored, setEmpenho] as const;
}
