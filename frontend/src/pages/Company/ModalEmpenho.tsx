import { useEffect } from "react";
import {
  Layers2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/format-currency";
import type { Empresa } from "../../../types/empresa";
import { Badge, Button, Modal, ModalBody, ModalFooter, ModalHeader, type BadgeTone } from "../../components/ui";

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
    const configs: Record<string, { tone: BadgeTone; icon: LucideIcon; label: string }> = {
      ATIVO: { tone: "success", icon: CheckCircle2, label: "Ativo" },
      FINALIZADO: { tone: "info", icon: Clock, label: "Finalizado" },
      CANCELADO: { tone: "danger", icon: XCircle, label: "Cancelado" },
    };
    return (
      configs[status.toUpperCase()] || {
        tone: "neutral" as const,
        icon: FileText,
        label: status || "Desconhecido",
      }
    );
  };

  if (!isOpen) return null;

  return (
    <Modal open size="lg" onBackdropClick={handleClose}>
      <ModalHeader
        icon={Building2}
        title={empresaSelecionada.name}
        description={
          <>
            {empresaSelecionada.empenhos.length} empenho
            {empresaSelecionada.empenhos.length !== 1 ? "s" : ""} vinculado
            {empresaSelecionada.empenhos.length !== 1 ? "s" : ""}
            {empenhosAtivos > 0 && (
              <span className="ml-2 text-success-text font-medium">
                ({empenhosAtivos} ativo{empenhosAtivos !== 1 ? "s" : ""})
              </span>
            )}
          </>
        }
        onClose={handleClose}
      />
      <ModalBody>
        {empenhosOrdenados.length > 0 ? (
          <div className="space-y-3">
            {empenhosOrdenados.map((empenho) => {
              const statusConfig = getStatusConfig(empenho.status || "");

              return (
                <div
                  key={empenho.id}
                  className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-surface-muted hover:border-border-strong transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-surface-muted border border-border rounded-lg flex items-center justify-center shrink-0">
                      <Layers2 size={16} className="text-text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate max-w-50">
                        {empenho.description}
                      </p>
                      <p className="font-medium text-text-secondary text-xs truncate">
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
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                    <p className="text-sm font-semibold text-text-primary tabular-nums">
                      {formatCurrency(empenho.value)}
                    </p>
                    <Badge tone={statusConfig.tone} icon={statusConfig.icon}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
            <div className="pt-4 border-t border-border mt-4">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">
                  Valor total dos empenhos:
                </span>
                <span className="text-lg font-semibold text-text-primary tabular-nums">
                  {formatCurrency(valorTotal)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Layers2 size={32} className="mx-auto text-text-muted mb-3" />
            <p className="text-sm text-text-secondary font-medium">
              Nenhum empenho vinculado
            </p>
            <p className="text-text-muted text-sm mt-1">
              Esta empresa ainda não possui empenhos cadastrados
            </p>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={handleClose}>
          Fechar
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ModalEmpenho;
