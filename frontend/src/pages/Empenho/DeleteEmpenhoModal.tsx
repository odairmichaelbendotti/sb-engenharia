import {
  Trash2,
  AlertTriangle,
  Building2,
  Calendar,
  DollarSign,
  FileText,
} from "lucide-react";
import type { EmpenhoList } from "../../../types/empenho";
import { useEmpenhos } from "../../store/empenhos";
import { toast } from "sonner";
import { useState } from "react";
import { formatCurrency, formatDate } from "../../utils/format-currency";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "../../components/ui";

interface DeleteEmpenhoModalProps {
  isOpen: boolean;
  empenho: EmpenhoList | null;
  handleClose: () => void;
}

export function DeleteEmpenhoModal({
  isOpen,
  empenho,
  handleClose,
}: DeleteEmpenhoModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleDeleteEmpenho(id: string) {
    try {
      setIsLoading(true);
      await deleteEmpenho(id);
      toast.success("Empenho excluído com sucesso");
      handleClose();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "Erro ao excluir empenho";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  const { deleteEmpenho } = useEmpenhos();

  if (!isOpen || !empenho) return null;

  return (
    <Modal open size="sm">
      <ModalHeader
        icon={AlertTriangle}
        title="Excluir Empenho Permanentemente"
        description="Esta ação não poderá ser desfeita"
        onClose={handleClose}
      />

      <ModalBody className="space-y-4">
        {/* Dados do empenho */}
        <div className="bg-surface-muted rounded-xl p-4 border border-border">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 bg-surface border border-border rounded-lg flex items-center justify-center shrink-0">
              <FileText size={16} className="text-text-primary" />
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-0.5">
                Número do Empenho
              </p>
              <p className="text-base font-semibold text-text-primary">
                {empenho.numero}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-text-muted" />
              <div>
                <p className="text-xs text-text-secondary">Contrato</p>
                <p className="text-sm font-medium text-text-primary truncate max-w-37.5">
                  {empenho.contrato.identificador} — {empenho.contrato.company.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-text-muted" />
              <div>
                <p className="text-xs text-text-secondary">Valor Total</p>
                <p className="text-sm font-medium text-text-primary">
                  {formatCurrency(empenho.value)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-text-muted" />
              <div>
                <p className="text-xs text-text-secondary">Início</p>
                <p className="text-sm font-medium text-text-primary">
                  {formatDate(empenho.startAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-text-muted" />
              <div>
                <p className="text-xs text-text-secondary">Prazo Final</p>
                <p className="text-sm font-medium text-text-primary">
                  {formatDate(empenho.endAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Aviso */}
        <div className="bg-warning-bg border border-warning-border rounded-lg p-3">
          <p className="text-xs text-warning-text">
            <span className="font-semibold">Atenção:</span> não será
            possível excluir este empenho caso existam obras ou notas
            fiscais vinculadas a ele.
          </p>
        </div>

        <p className="text-center text-text-secondary text-sm">
          Deseja realmente prosseguir com a exclusão?
        </p>
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" onClick={() => handleClose()}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          icon={Trash2}
          loading={isLoading}
          onClick={() => handleDeleteEmpenho(empenho.id)}
        >
          Sim, Excluir Empenho
        </Button>
      </ModalFooter>
    </Modal>
  );
}
