import { useEffect } from "react";
import {
  Layers2,
  X,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
} from "lucide-react";
import { formatCurrency } from "../../utils/format-currency";
import type { Empresa } from "../../../types/empresa";

type ModelEmpenhoProps = {
  isOpen: boolean;
  handleClose: () => void;
  empresaSelecionada: Empresa;
};

const ModalEmpenho = ({
  isOpen,
  handleClose,
  empresaSelecionada,
}: ModelEmpenhoProps) => {
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  // Ordena empenhos por data de término (mais recente primeiro)
  const empenhosOrdenados = [...empresaSelecionada.empenhos].sort((a, b) => {
    return new Date(b.endAt).getTime() - new Date(a.endAt).getTime();
  });

  // Calcula valor total
  const valorTotal = empenhosOrdenados.reduce((sum, e) => sum + e.value, 0);

  // Conta empenhos ativos
  const empenhosAtivos = empenhosOrdenados.filter(
    (e) => e.status === "ativo",
  ).length;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [handleClose]);

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
      ATIVO: {
        bg: "bg-success-bg",
        text: "text-success-text",
        border: "border-success-border",
        icon: CheckCircle2,
        label: "Ativo",
      },
      FINALIZADO: {
        bg: "bg-blue-100",
        text: "text-blue-600",
        border: "border-blue-200",
        icon: Clock,
        label: "Finalizado",
      },
      CANCELADO: {
        bg: "bg-danger-bg",
        text: "text-danger-text",
        border: "border-danger-border",
        icon: XCircle,
        label: "Cancelado",
      },
    };
    return (
      configs[status.toUpperCase()] || {
        bg: "bg-surface-muted",
        text: "text-text-secondary",
        border: "border-border",
        icon: FileText,
        label: status || "Desconhecido",
      }
    );
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleClose();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
    >
      <div className="bg-surface rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Empenhos - {empresaSelecionada.name}
            </h2>
            <p className="text-sm text-text-secondary">
              {empresaSelecionada.empenhos.length} empenho
              {empresaSelecionada.empenhos.length !== 1 ? "s" : ""} vinculado
              {empresaSelecionada.empenhos.length !== 1 ? "s" : ""}
              {empenhosAtivos > 0 && (
                <span className="ml-2 text-success-text font-medium">
                  ({empenhosAtivos} ativo{empenhosAtivos !== 1 ? "s" : ""})
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 cursor-pointer hover:bg-surface-muted rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {empenhosOrdenados.length > 0 ? (
            <div className="space-y-3">
              {empenhosOrdenados.map((empenho) => {
                const statusConfig = getStatusConfig(empenho.status || "");
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={empenho.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-surface-muted hover:border-primary-200 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
                        <Layers2
                          size={18}
                          className="text-secondary-500 group-hover:text-primary-500 transition-colors"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-text-secondary truncate max-w-50">
                          {empenho.description}
                        </p>
                        <p className="font-medium text-text-primary text-xs truncate">
                          {empenho.numero}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                          <Calendar size={12} />
                          <span>
                            {formatDate(empenho.startAt)} -{" "}
                            {formatDate(empenho.endAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-semibold text-text-primary">
                        {formatCurrency(empenho.value)}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                      >
                        <StatusIcon size={12} />
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div className="pt-4 border-t border-border mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">
                    Valor total dos empenhos:
                  </span>
                  <span className="text-lg font-bold text-primary-600">
                    {formatCurrency(valorTotal)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Layers2 size={48} className="mx-auto text-text-muted mb-4" />
              <p className="text-text-secondary font-medium">
                Nenhum empenho vinculado
              </p>
              <p className="text-text-muted text-sm mt-1">
                Esta empresa ainda não possui empenhos cadastrados
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-end p-4 border-t border-border shrink-0">
          <button
            onClick={handleClose}
            className="cursor-pointer px-4 py-2 text-text-secondary hover:bg-surface-muted rounded-md transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEmpenho;
