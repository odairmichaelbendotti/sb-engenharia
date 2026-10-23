import { useState } from "react";
import { toast } from "sonner";
import type { Contrato } from "../../../types/contrato";
import { useContratos } from "../../store/contratos";
import { formatCurrency } from "../../utils/format-currency";
import { ConfirmDialog } from "../../components/ui";

interface DeleteContratoModalProps {
  isOpen: boolean;
  contrato: Contrato | null;
  handleClose: () => void;
}

export function DeleteContratoModal({ isOpen, contrato, handleClose }: DeleteContratoModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { deleteContrato } = useContratos();

  if (!isOpen || !contrato) return null;
  const empenhos = contrato.empenhos.length;
  const blocked = empenhos > 0;

  async function handleConfirm() {
    if (!contrato) return;
    try {
      setIsLoading(true);
      await deleteContrato(contrato.id);
      toast.success("Contrato excluído com sucesso");
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir contrato");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ConfirmDialog
      open
      title={`Excluir o contrato ${contrato.identificador}?`}
      confirmLabel="Excluir contrato"
      loading={isLoading}
      confirmDisabled={blocked}
      onConfirm={handleConfirm}
      onCancel={handleClose}
    >
      <p>
        <span className="font-semibold text-text-primary">{contrato.company.name}</span> ·{" "}
        {formatCurrency(contrato.valor)}. Esta ação não pode ser desfeita.
      </p>
      {blocked && (
        <p className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger-text">
          O contrato tem {empenhos} {empenhos === 1 ? "empenho vinculado" : "empenhos vinculados"}. Exclua ou realoque os
          empenhos antes de excluir o contrato.
        </p>
      )}
    </ConfirmDialog>
  );
}
