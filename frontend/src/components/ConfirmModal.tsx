import { useEffect } from "react";
import { Button } from "./ui";

type ConfirmModalVariant = "danger" | "success";

interface ConfirmModalProps {
  open: boolean;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant: ConfirmModalVariant;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const stripeStyles: Record<ConfirmModalVariant, string> = {
  success: "bg-success-text",
  danger: "bg-danger-text",
};

export function ConfirmModal({
  open,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => !isLoading && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="relative bg-surface rounded-xl w-full max-w-sm shadow-2xl border border-border overflow-hidden animate-row-in"
      >
        <span className={`absolute inset-y-0 left-0 w-1 ${stripeStyles[variant]}`} />

        <div className="pl-5 pr-4 py-4">
          <p className="text-sm text-text-primary leading-snug">{message}</p>

          <div className="flex items-center justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
              {cancelLabel}
            </Button>
            <Button variant={variant} size="sm" onClick={onConfirm} loading={isLoading}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
