import { useEffect } from "react";
import { AlertTriangle, Clock, X } from "lucide-react";
import { formatDateOnly } from "../../utils/format-currency";
import { daysUntil, plural } from "./obra-detail-utils";

export function StatusPill({ status, map }: { status: string; map: Record<string, { label: string; className: string }> }) {
  const entry = map[status] ?? { label: status, className: "bg-surface-muted text-text-secondary border-border" };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-semibold border whitespace-nowrap ${entry.className}`}>
      {entry.label}
    </span>
  );
}

export function PendingBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-border-strong bg-surface-muted text-text-muted text-[10px] font-semibold shrink-0">
      <Clock size={10} />
      Em breve
    </span>
  );
}

export function ProgressBar({ percent, colorClassName }: { percent: number; colorClassName: string }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="w-full h-1.5 rounded-full bg-surface-muted overflow-hidden">
      <div className={`h-full rounded-full ${colorClassName}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function Card({
  icon,
  title,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-text-muted flex">{icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-wide text-text-muted flex-1 truncate">{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

export function VigenciaAlert({ label, endAt }: { label: string; endAt: string }) {
  const days = daysUntil(endAt);
  const expired = days < 0;
  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
        expired
          ? "bg-danger-bg border-danger-border text-danger-text"
          : days <= 30
            ? "bg-warning-bg border-warning-border text-warning-text"
            : "bg-success-bg border-success-border text-success-text"
      }`}
    >
      <AlertTriangle size={13} className="shrink-0" />
      {label} até {formatDateOnly(endAt)} —{" "}
      {expired ? `encerrada há ${plural(-days, "dia", "dias")}` : `${plural(days, "dia", "dias")} restante${days === 1 ? "" : "s"}`}
    </div>
  );
}

// Modal aberto a partir do painel: z-index acima do drawer (1201) e do mapa
export function PanelModal({
  icon,
  title,
  subtitle,
  onClose,
  children,
  maxWidthClassName = "max-w-2xl",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClassName?: string;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        // Esc fecha só o modal, sem propagar para o painel por baixo
        e.stopImmediatePropagation();
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1300] p-4"
      onClick={onClose}
    >
      <div
        className={`bg-surface rounded-2xl w-full ${maxWidthClassName} max-h-[90vh] flex flex-col shadow-2xl border border-border`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border bg-linear-to-r from-primary-50/50 to-transparent shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0 text-primary-600">
              {icon}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-text-primary truncate">{title}</h2>
              {subtitle && <div className="text-xs text-text-secondary mt-0.5">{subtitle}</div>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-muted rounded-lg transition-colors cursor-pointer shrink-0"
            title="Fechar"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
