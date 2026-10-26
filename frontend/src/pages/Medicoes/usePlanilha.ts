import { useCallback, useEffect, useState } from "react";
import type { PlanilhaOrcamento } from "../../../types/medicao";
import { useMedicoes } from "../../store/medicoes";

/**
 * Orçamento, panorama e medições da OS da tela. `version` muda a cada carga, para os editores
 * remontarem com o que foi gravado.
 */
export function usePlanilha(ordemServicoId: string) {
  const fetchPlanilha = useMedicoes((s) => s.fetchPlanilha);
  const [planilha, setPlanilha] = useState<PlanilhaOrcamento | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  // Pedido de recarga (depois de salvar, fechar, reabrir...)
  const [pedido, setPedido] = useState(0);

  useEffect(() => {
    let ativo = true;
    fetchPlanilha(ordemServicoId)
      .then((data) => {
        if (!ativo) return;
        setPlanilha(data);
        setError(null);
        setVersion((v) => v + 1);
      })
      .catch((err) => ativo && setError(err instanceof Error ? err.message : "Erro ao carregar o orçamento da OS"));
    return () => {
      ativo = false;
    };
  }, [fetchPlanilha, ordemServicoId, pedido]);

  const reload = useCallback(() => setPedido((n) => n + 1), []);

  return { planilha, error, version, reload };
}
