import { useState } from "react";
import { toast } from "sonner";
import type { Obra } from "../../../types/obra";
import { useObras } from "../../store/obras";
import { ConfirmDialog } from "../../components/ui";

// Confirmação de "Concluir obra" (obra paga): status concluída com a data de hoje
export function CompleteObraDialog({
  obra,
  open,
  onClose,
}: {
  obra: Pick<Obra, "id" | "nome" | "identificacaoPatrimonial">;
  open: boolean;
  onClose: () => void;
}) {
  const updateObraStatus = useObras((s) => s.updateObraStatus);
  const [loading, setLoading] = useState(false);

  const complete = async () => {
    setLoading(true);
    try {
      await updateObraStatus(obra.id, "CONCLUIDA");
      toast.success(`Obra "${obra.nome}" concluída`);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao concluir a obra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      tone="success"
      title={`Concluir a obra ${obra.identificacaoPatrimonial}?`}
      confirmLabel="Concluir obra"
      loading={loading}
      onConfirm={complete}
      onCancel={onClose}
    >
      <p>
        <span className="font-semibold text-text-primary">{obra.nome}.</span> Nenhuma OS da obra tem saldo a liquidar.
        A obra passa a concluída com a data de hoje.
      </p>
    </ConfirmDialog>
  );
}
