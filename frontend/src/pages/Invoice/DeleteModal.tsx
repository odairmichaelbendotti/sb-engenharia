import {
  Trash2,
  AlertTriangle,
  FileDigit,
  Building2,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useInvoice, type Invoice } from "../../store/invoices";
import { toast } from "sonner";
import { useState } from "react";
import { formatCurrency, formatDate } from "../../utils/format-currency";
import { Badge, Button, Modal, ModalBody, ModalFooter, ModalHeader, type BadgeTone } from "../../components/ui";

type DeleteModalProps = {
  deleteInvoice: Invoice | null;
  setDeleteInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
};

const getStatusConfig = (status: string) => {
  const configs: Record<string, { tone: BadgeTone; icon: LucideIcon; label: string }> = {
    PAGO: { tone: "success", icon: CheckCircle2, label: "Pago" },
    PENDENTE: { tone: "warning", icon: Clock, label: "Pendente" },
    VENCIDO: { tone: "danger", icon: AlertCircle, label: "Vencido" },
    CANCELADO: { tone: "neutral", icon: XCircle, label: "Cancelado" },
  };
  return configs[status.toUpperCase()] || configs.PENDENTE;
};

export function DeleteModal({
  deleteInvoice,
  setDeleteInvoice,
}: DeleteModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const { delete: deleteInvoiceFn } = useInvoice();

  if (!deleteInvoice) return null;
  const status = getStatusConfig(deleteInvoice.status);

  async function handleDeleteInvoice(id: string) {
    setIsLoading(true);
    try {
      await deleteInvoiceFn(id);
      toast.success("Nota fiscal excluída com sucesso");
      setDeleteInvoice(null);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir nota fiscal");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal open size="sm">
      <ModalHeader
        icon={AlertTriangle}
        title="Excluir Nota Fiscal"
        description="Esta ação não pode ser desfeita"
        onClose={() => setDeleteInvoice(null)}
      />

      <ModalBody className="space-y-4">
        {/* Card da NF */}
        <div className="bg-surface-muted rounded-xl border border-border p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <FileDigit size={16} className="text-text-muted" />
              <span className="text-sm font-semibold text-text-primary">
                {deleteInvoice.numero}
              </span>
            </div>
            <Badge tone={status.tone} icon={status.icon}>
              {status.label}
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <Building2 size={14} className="text-text-muted" />
              <span>{deleteInvoice.company?.name || "Sem cliente"}</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <Calendar size={14} className="text-text-muted" />
              <span>Vencimento: {formatDate(deleteInvoice.vencimento)}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-text-muted" />
              <span className="font-medium text-text-primary">
                {formatCurrency(deleteInvoice.value)}
              </span>
            </div>
            {deleteInvoice.description && (
              <p className="text-text-secondary text-xs pt-2 border-t border-border mt-2">
                {deleteInvoice.description}
              </p>
            )}
          </div>
        </div>

        {/* Aviso */}
        <div className="flex items-start gap-2 p-3 bg-warning-bg border border-warning-border rounded-lg">
          <AlertTriangle
            size={16}
            className="text-warning-text shrink-0 mt-0.5"
          />
          <p className="text-sm text-text-secondary">
            Ao excluir esta nota fiscal, todos os dados relacionados serão
            permanentemente removidos do sistema.
          </p>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" onClick={() => setDeleteInvoice(null)}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          icon={Trash2}
          loading={isLoading}
          onClick={() => handleDeleteInvoice(deleteInvoice.id)}
        >
          Sim, excluir
        </Button>
      </ModalFooter>
    </Modal>
  );
}
