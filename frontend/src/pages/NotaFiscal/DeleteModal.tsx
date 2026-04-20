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
  Loader,
} from "lucide-react";
import { useInvoice, type Invoice } from "../../store/invoices";
import { toast } from "sonner";
import { useState } from "react";

type DeleteModalProps = {
  deleteInvoice: Invoice | null;
  setDeleteInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
};

const getStatusConfig = (status: string) => {
  const configs: Record<
    string,
    {
      bg: string;
      text: string;
      border: string;
      icon: typeof CheckCircle2;
      label: string;
    }
  > = {
    PAGO: {
      bg: "bg-success-bg",
      text: "text-success-text",
      border: "border-success-border",
      icon: CheckCircle2,
      label: "Pago",
    },
    PENDENTE: {
      bg: "bg-warning-bg",
      text: "text-warning-text",
      border: "border-warning-border",
      icon: Clock,
      label: "Pendente",
    },
    VENCIDO: {
      bg: "bg-danger-bg",
      text: "text-danger-text",
      border: "border-danger-border",
      icon: AlertCircle,
      label: "Vencido",
    },
    CANCELADO: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      border: "border-gray-200",
      icon: XCircle,
      label: "Cancelado",
    },
  };
  return configs[status.toUpperCase()] || configs.PENDENTE;
};

const formatDate = (date: string) => new Date(date).toLocaleDateString("pt-BR");
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

export function DeleteModal({
  deleteInvoice,
  setDeleteInvoice,
}: DeleteModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const { delete: deleteInvoiceFn } = useInvoice();

  if (!deleteInvoice) return null;
  const status = getStatusConfig(deleteInvoice.status);
  const StatusIcon = status.icon;

  async function handleDeleteInvoice(id: string) {
    setIsLoading(true);
    try {
      await deleteInvoiceFn(id);
      toast.success("Nota fiscal excluída com sucesso");
      setDeleteInvoice(null);
    } catch (error) {
      console.log(error);
      toast.error("Erro ao excluir nota fiscal");
      throw new Error("Erro ao excluir nota fiscal");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl w-full max-w-md shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Header com alerta */}
        <div className="bg-danger-bg/50 p-4 border-b border-danger-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-danger-bg rounded-full flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-danger-text" />
            </div>
            <div>
              <h3 className="font-semibold text-danger-text">
                Excluir Nota Fiscal
              </h3>
              <p className="text-sm text-danger-text/80">
                Esta ação não pode ser desfeita
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {/* Card da NF */}
          <div className="bg-surface-muted rounded-lg border border-border p-4 mb-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileDigit size={16} className="text-primary-500" />
                <span className="font-semibold text-text-primary">
                  {deleteInvoice.numero}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}
              >
                <StatusIcon size={10} />
                {status.label}
              </span>
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
          <div className="flex items-start gap-2 p-3 bg-warning-bg/30 rounded-lg mb-6">
            <AlertTriangle
              size={16}
              className="text-warning-text shrink-0 mt-0.5"
            />
            <p className="text-sm text-text-secondary">
              Ao excluir esta nota fiscal, todos os dados relacionados serão
              permanentemente removidos do sistema.
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteInvoice(null)}
              className="flex-1 flex justify-center items-center cursor-pointer px-4 py-2.5 text-text-secondary hover:bg-surface-muted rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleDeleteInvoice(deleteInvoice.id)}
              className="flex-1 cursor-pointer px-4 py-2.5 bg-danger-text text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="animate-spin" />
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Sim, excluir
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
