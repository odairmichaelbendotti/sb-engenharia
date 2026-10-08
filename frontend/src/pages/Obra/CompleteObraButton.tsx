import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Obra } from "../../../types/obra";
import { useObras } from "../../store/obras";

// Os cliques não podem chegar à linha, que abre o resumo da obra
const stop = (e: React.SyntheticEvent) => e.stopPropagation();

// Conclui a obra paga (status concluída + data de conclusão), com confirmação no próprio lugar
export function CompleteObraButton({ obra }: { obra: Obra }) {
  const updateObraStatus = useObras((s) => s.updateObraStatus);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const complete = async () => {
    setLoading(true);
    try {
      await updateObraStatus(obra.id, "CONCLUIDA");
      toast.success(`Obra "${obra.nome}" concluída`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao concluir a obra");
      setLoading(false);
    }
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          setConfirming(true);
        }}
        onKeyDown={stop}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold cursor-pointer transition-colors"
      >
        <CheckCircle2 size={13} />
        Concluir obra
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5" onClick={stop} onKeyDown={stop}>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={loading}
        className="px-2.5 py-1.5 rounded-md border border-border bg-surface text-text-secondary hover:bg-surface-muted text-xs font-medium cursor-pointer transition-colors disabled:cursor-not-allowed"
      >
        Voltar
      </button>
      <button
        type="button"
        onClick={complete}
        disabled={loading}
        title="Marca a obra como concluída com a data de hoje"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold cursor-pointer transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading && <Loader2 size={12} className="animate-spin" />}
        Confirmar
      </button>
    </div>
  );
}
