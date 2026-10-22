import { Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useObras } from "../../store/obras";
import type { Obra } from "../../../types/obra";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "../../components/ui";

interface DeleteObraModalProps {
  obra: Obra;
  handleClose: () => void;
}

export function DeleteObraModal({ obra, handleClose }: DeleteObraModalProps) {
  const { deleteObra } = useObras();
  const [isLoading, setIsLoading] = useState(false);

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
    <Modal open size="sm">
      <ModalHeader
        icon={AlertTriangle}
        title="Excluir Obra"
        description="Esta ação não pode ser desfeita"
        onClose={handleClose}
      />

      <ModalBody className="space-y-4">
        <div className="bg-danger-bg border border-danger-border rounded-lg p-4">
          <p className="text-sm text-danger-text font-medium">Você está prestes a excluir permanentemente a obra:</p>
          <p className="text-sm text-text-primary font-semibold mt-1">"{obra.nome}"</p>
          <p className="text-xs text-text-muted mt-1">
            {obra.identificacaoPatrimonial} · OS {obra.ordensServico.map((os) => os.numero).join(", ")}
          </p>
        </div>
        <p className="text-sm text-text-secondary">
          As ordens de serviço da obra não são excluídas: voltam a ficar sem obra. Confirme somente se tiver certeza.
        </p>
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button variant="danger" icon={Trash2} loading={isLoading} onClick={handleConfirm}>
          {isLoading ? "Excluindo..." : "Excluir Obra"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
