import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "../../utils/cx";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-text-secondary border-border",
  success: "bg-success-bg text-success-text border-success-border",
  warning: "bg-warning-bg text-warning-text border-warning-border",
  danger: "bg-danger-bg text-danger-text border-danger-border",
  info: "bg-info-bg text-info-text border-info-border",
};

interface BadgeProps {
  tone?: BadgeTone;
  icon?: LucideIcon;
  // Dica ao passar o mouse
  title?: string;
  className?: string;
  children: ReactNode;
}

// Etiqueta de status/categoria. Cor só quando o status tem significado (pago, vencido...)
export function Badge({ tone = "neutral", icon: Icon, title, className, children }: BadgeProps) {
  return (
    <span
      title={title}
      className={cx(
        "inline-flex items-center gap-1 h-6 px-2 rounded-md border text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
    >
      {Icon && <Icon size={12} className="shrink-0" />}
      {children}
    </span>
  );
}
