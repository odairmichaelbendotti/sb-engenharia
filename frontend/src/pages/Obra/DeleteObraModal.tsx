import { useState } from "react";
import { toast } from "sonner";
import { useObras } from "../../store/obras";
import type { Obra } from "../../../types/obra";
import { ConfirmDialog } from "../../components/ui";

interface DeleteObraModalProps {
  obra: Obra;
  handleClose: () => void;
}

export function DeleteObraModal({ obra, handleClose }: DeleteObraModalProps) {
  const { deleteObra } = useObras();
  const [isLoading, setIsLoading] = useState(false);
  const ordens = obra.ordensServico.length;

  async function handleConfirm() {
    try {
      setIsLoading(true);
      await deleteObra(obra.id);
      toast.success(`Obra "${obra.nome}" excluída com sucesso`);
      handleClose();
    } catch {
      toast.error("Erro ao excluir obra. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ConfirmDialog
      open
      title={`Excluir a obra ${obra.identificacaoPatrimonial}?`}
      confirmLabel="Excluir obra"
      loading={isLoading}
      onConfirm={handleConfirm}
      onCancel={handleClose}
    >
      <p>
        <span className="font-semibold text-text-primary">{obra.nome}.</span>{" "}
        {ordens > 0
          ? `${ordens === 1 ? "A ordem de serviço da obra não é excluída: volta" : `As ${ordens} ordens de serviço da obra não são excluídas: voltam`} a ficar sem obra.`
          : "A obra não tem ordens de serviço."}{" "}
        Esta ação não pode ser desfeita.
      </p>
    </ConfirmDialog>
  );
}
