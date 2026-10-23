import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, type LucideIcon } from "lucide-react";
import { cx } from "../../utils/cx";
import { Button } from "./Button";
import { Modal, ModalTitle } from "./Modal";

type ConfirmTone = "danger" | "success" | "neutral";

const toneClasses: Record<ConfirmTone, string> = {
  danger: "bg-danger-bg text-danger-text",
  success: "bg-success-bg text-success-text",
  neutral: "bg-surface-muted text-text-primary",
};

const defaultIcon: Record<ConfirmTone, LucideIcon> = {
  danger: AlertTriangle,
  success: CheckCircle2,
  neutral: AlertTriangle,
};

interface ConfirmDialogProps {
  open: boolean;
  // danger = excluir/recusar; success = finalizar, concluir, dar ciência
  tone?: ConfirmTone;
  icon?: LucideIcon;
  // Pergunta direta ("Excluir a obra BAFL-0412?")
  title: ReactNode;
  // Consequência da ação; pode trazer um aviso ou um campo (ex.: motivo)
  children?: ReactNode;
  // Nome da ação no botão ("Excluir obra"), nunca só "Confirmar"
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  // Ação bloqueada (ex.: empresa com empenhos): o botão fica desabilitado e o corpo explica
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Diálogo de confirmação único do sistema: ícone no tom da ação, pergunta como título,
 * consequência no corpo e o botão nomeando a ação. Substitui os modais de exclusão.
 */
export function ConfirmDialog({
  open,
  tone = "danger",
  icon,
  title,
  children,
  confirmLabel,
  cancelLabel = "Cancelar",
  loading = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const Icon = icon ?? defaultIcon[tone];

  return (
    <Modal open={open} size="sm" elevated onClose={() => !loading && onCancel()}>
      <div className="p-5 pb-4 flex flex-col gap-4 overflow-y-auto">
        <div className="flex items-start gap-3.5">
          <span className={cx("w-10 h-10 rounded-full flex items-center justify-center shrink-0", toneClasses[tone])}>
            <Icon size={18} />
          </span>
          <div className="min-w-0 flex flex-col gap-1.5 pt-0.5">
            <ModalTitle>{title}</ModalTitle>
            {children && <div className="text-sm leading-relaxed text-text-secondary space-y-3">{children}</div>}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "neutral" ? "primary" : tone}
            onClick={onConfirm}
            loading={loading}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

