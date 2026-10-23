import { cx } from "../../utils/cx";
import type { BadgeTone } from "./Badge";

const toneClasses: Record<BadgeTone, { pill: string; dot: string }> = {
  neutral: { pill: "bg-surface-muted text-text-secondary border-border", dot: "bg-primary-300" },
  info: { pill: "bg-info-bg text-info-text border-info-border", dot: "bg-info-text" },
  success: { pill: "bg-success-bg text-success-text border-success-border", dot: "bg-success-text" },
  warning: { pill: "bg-warning-bg text-warning-text border-warning-border", dot: "bg-warning-text" },
  danger: { pill: "bg-danger-bg text-danger-text border-danger-border", dot: "bg-danger-text" },
};

interface StatusPillProps {
  tone: BadgeTone;
  // Dica ao passar o mouse (ex.: "Prazo vencido há 3 dias")
  title?: string;
  size?: "sm" | "md";
  children: React.ReactNode;
}

/**
 * Selo de status com ponto, igual em todas as telas. O tom vem de `utils/status-display.ts`:
 * info = em curso, warning = vence em breve / aguarda alguém, danger = vencido / paralisado,
 * success = pago / concluído, neutral = encerrado (finalizado, cancelado).
 */
export function StatusPill({ tone, title, size = "md", children }: StatusPillProps) {
  const classes = toneClasses[tone];
  return (
    <span
      title={title}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        size === "md" ? "h-6 pl-2 pr-2.5 text-xs" : "h-5 pl-1.5 pr-2 text-[11px]",
        classes.pill,
      )}
    >
      <span aria-hidden className={cx("w-1.5 h-1.5 rounded-full shrink-0", classes.dot)} />
      {children}
    </span>
  );
}
