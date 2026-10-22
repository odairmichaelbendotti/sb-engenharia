import {
  Trash2,
  AlertTriangle,
  Building2,
  Calendar,
  DollarSign,
  FileSignature,
} from "lucide-react";
import type { Contrato } from "../../../types/contrato";
import { useContratos } from "../../store/contratos";
import { toast } from "sonner";
import { useState } from "react";
import { formatCurrency, formatDate } from "../../utils/format-currency";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "../../components/ui";

interface DeleteContratoModalProps {
  isOpen: boolean;
  contrato: Contrato | null;
  handleClose: () => void;
}

export function DeleteContratoModal({
  isOpen,
  contrato,
  handleClose,
}: DeleteContratoModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { deleteContrato } = useContratos();

  async function handleDeleteContrato(id: string) {
    try {
      setIsLoading(true);
      await deleteContrato(id);
      toast.success("Contrato excluído com sucesso");
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao excluir contrato";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen || !contrato) return null;

  const hasEmpenhos = contrato.empenhos.length > 0;

  return (
    <Modal open size="sm" onClose={handleClose}>
      <ModalHeader
        icon={AlertTriangle}
        title="Excluir Contrato Permanentemente"
        description="Esta ação não poderá ser desfeita"
        onClose={handleClose}
      />

      <ModalBody className="space-y-4">
        <div className="bg-surface-muted rounded-xl p-4 border border-border">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 bg-surface border border-border rounded-lg flex items-center justify-center shrink-0">
              <FileSignature size={18} className="text-text-primary" />
            </div>
            <div>
              <p className="text-xs text-text-muted mb-0.5">Identificador</p>
              <p className="text-base font-semibold text-text-primary">{contrato.identificador}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-text-muted" />
              <div>
                <p className="text-xs text-text-muted">Empresa</p>
                <p className="text-sm font-medium text-text-primary truncate max-w-37.5">
                  {contrato.company.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-text-muted" />
              <div>
                <p className="text-xs text-text-muted">Valor</p>
                <p className="text-sm font-medium text-text-primary">{formatCurrency(contrato.valor)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-text-muted" />
              <div>
                <p className="text-xs text-text-muted">Início</p>
                <p className="text-sm font-medium text-text-primary">{formatDate(contrato.dataInicio)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-text-muted" />
              <div>
                <p className="text-xs text-text-muted">Fim</p>
                <p className="text-sm font-medium text-text-primary">{formatDate(contrato.dataFim)}</p>
              </div>
            </div>
          </div>
        </div>

        {hasEmpenhos ? (
          <div className="bg-danger-bg border border-danger-border rounded-lg p-3.5">
            <p className="text-xs text-danger-text">
              <span className="font-semibold">Atenção:</span> este contrato possui{" "}
              {contrato.empenhos.length} empenho{contrato.empenhos.length !== 1 ? "s" : ""} vinculado
              {contrato.empenhos.length !== 1 ? "s" : ""}. Exclua ou realoque os empenhos antes de excluir o contrato.
            </p>
          </div>
        ) : (
          <p className="text-center text-text-secondary text-sm">Deseja realmente prosseguir com a exclusão?</p>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" onClick={() => handleClose()}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          icon={Trash2}
          loading={isLoading}
          disabled={hasEmpenhos}
          onClick={() => handleDeleteContrato(contrato.id)}
        >
          Sim, Excluir Contrato
        </Button>
      </ModalFooter>
    </Modal>
  );
}
