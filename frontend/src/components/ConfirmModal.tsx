import { useEffect } from "react";
import { Loader2 } from "lucide-react";

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

const variantStyles: Record<
  ConfirmModalVariant,
  { stripe: string; confirmButton: string }
> = {
  success: {
    stripe: "bg-success-text",
    confirmButton: "bg-success-text text-white hover:opacity-90",
  },
  danger: {
    stripe: "bg-danger-text",
    confirmButton: "bg-danger-text text-white hover:opacity-90",
  },
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

  const styles = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => !isLoading && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="relative bg-surface rounded-lg w-full max-w-sm shadow-2xl border border-border overflow-hidden animate-row-in"
      >
        <span className={`absolute inset-y-0 left-0 w-1 ${styles.stripe}`} />

        <div className="pl-5 pr-4 py-4">
          <p className="text-sm text-text-primary leading-snug">{message}</p>

          <div className="flex items-center justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-3.5 py-1.5 cursor-pointer text-sm text-text-secondary hover:bg-surface-muted rounded-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm rounded-md transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed ${styles.confirmButton}`}
            >
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
