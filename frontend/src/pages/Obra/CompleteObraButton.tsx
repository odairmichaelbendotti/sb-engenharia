import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { Obra } from "../../../types/obra";
import { useObras } from "../../store/obras";
import { Button } from "../../components/ui";

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
      <Button
        variant="success"
        size="sm"
        icon={CheckCircle2}
        onClick={(e) => {
          stop(e);
          setConfirming(true);
        }}
        onKeyDown={stop}
      >
        Concluir obra
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5" onClick={stop} onKeyDown={stop}>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={loading}>
        Voltar
      </Button>
      <Button
        variant="success"
        size="sm"
        onClick={complete}
        loading={loading}
        title="Marca a obra como concluída com a data de hoje"
      >
        Confirmar
      </Button>
    </div>
  );
}
