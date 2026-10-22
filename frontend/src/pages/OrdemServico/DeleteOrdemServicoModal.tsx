import {
  Trash2,
  AlertTriangle,
  FileSignature,
  DollarSign,
  ClipboardList,
} from "lucide-react";
import type { OrdemServico } from "../../../types/ordem-servico";
import { useOrdensServico } from "../../store/ordensServico";
import { toast } from "sonner";
import { useState } from "react";
import { formatCurrency } from "../../utils/format-currency";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "../../components/ui";

interface DeleteOrdemServicoModalProps {
  isOpen: boolean;
  ordemServico: OrdemServico | null;
  handleClose: () => void;
}

export function DeleteOrdemServicoModal({
  isOpen,
  ordemServico,
  handleClose,
}: DeleteOrdemServicoModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { deleteOrdemServico } = useOrdensServico();

  async function handleDeleteOrdemServico(id: string) {
    try {
      setIsLoading(true);
      await deleteOrdemServico(id);
      toast.success("Ordem de serviço excluída com sucesso");
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao excluir ordem de serviço";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen || !ordemServico) return null;

  const hasObra = ordemServico.obra !== null;

  return (
    <Modal open size="md">
      <ModalHeader
        icon={AlertTriangle}
        title="Excluir Ordem de Serviço Permanentemente"
        description="Esta ação não poderá ser desfeita"
        onClose={handleClose}
      />

      <ModalBody className="space-y-4">
        {/* Dados da ordem de serviço */}
        <div className="bg-surface-muted rounded-xl p-4 border border-border">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 bg-surface border border-border rounded-lg flex items-center justify-center shrink-0">
              <ClipboardList size={16} className="text-text-primary" />
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-0.5">Número</p>
              <p className="text-base font-semibold text-text-primary">{ordemServico.numero}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <FileSignature size={14} className="text-text-muted" />
              <div>
                <p className="text-xs text-text-secondary">Empenho</p>
                <p className="text-sm font-medium text-text-primary truncate max-w-37.5">
                  {ordemServico.empenhos.map((v) => v.numero).join(", ")} — {ordemServico.empenho.contrato.identificador}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-text-muted" />
              <div>
                <p className="text-xs text-text-secondary">Valor</p>
                <p className="text-sm font-medium text-text-primary">{formatCurrency(ordemServico.valor)}</p>
              </div>
            </div>
          </div>
        </div>

        {hasObra ? (
          <div className="bg-danger-bg border border-danger-border rounded-lg p-3">
            <p className="text-sm text-danger-text">
              <span className="font-semibold">Atenção:</span> esta ordem de serviço está vinculada
              à obra "{ordemServico.obra?.nome}". Exclua ou realoque a obra antes de excluir a ordem
              de serviço.
            </p>
          </div>
        ) : (
          <p className="text-center text-text-secondary text-sm">
            Deseja realmente prosseguir com a exclusão?
          </p>
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
          disabled={hasObra}
          onClick={() => handleDeleteOrdemServico(ordemServico.id)}
        >
          Sim, Excluir Ordem de Serviço
        </Button>
      </ModalFooter>
    </Modal>
  );
}
