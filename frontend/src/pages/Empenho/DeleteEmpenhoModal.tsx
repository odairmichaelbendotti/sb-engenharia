import { useState } from "react";
import { toast } from "sonner";
import type { EmpenhoList } from "../../../types/empenho";
import { useEmpenhos } from "../../store/empenhos";
import { formatCurrency } from "../../utils/format-currency";
import { ConfirmDialog } from "../../components/ui";

interface DeleteEmpenhoModalProps {
  isOpen: boolean;
  empenho: EmpenhoList | null;
  handleClose: () => void;
}

export function DeleteEmpenhoModal({ isOpen, empenho, handleClose }: DeleteEmpenhoModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { deleteEmpenho } = useEmpenhos();

  if (!isOpen || !empenho) return null;

  async function handleConfirm() {
    if (!empenho) return;
    try {
      setIsLoading(true);
      await deleteEmpenho(empenho.id);
      toast.success("Empenho excluído com sucesso");
      handleClose();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Erro ao excluir empenho");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ConfirmDialog
      open
      title={`Excluir o empenho ${empenho.numero}?`}
      confirmLabel="Excluir empenho"
      loading={isLoading}
      onConfirm={handleConfirm}
      onCancel={handleClose}
    >
      <p>
        <span className="font-semibold text-text-primary">{formatCurrency(empenho.value)}</span> do contrato{" "}
        {empenho.contrato.identificador} ({empenho.contrato.company.name}). Esta ação não pode ser desfeita.
      </p>
      <p className="rounded-lg border border-warning-border bg-warning-bg px-3 py-2 text-xs text-warning-text">
        Não é possível excluir um empenho com ordens de serviço ou notas fiscais vinculadas.
      </p>
    </ConfirmDialog>
  );
}
