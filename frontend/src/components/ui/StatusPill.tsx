import { cx } from "../../utils/cx";

/**
 * Tons do selo de status (paleta "Grafite e sinal", 2026-10-26):
 * active = em curso (estado padrão, grafite com ponto cheio), closed = encerrado (sem fundo,
 * ponto vazado), warning = vence em breve / aguarda alguém, danger = vencido / paralisado,
 * success = pago / concluído. Azul não é status.
 */
export type StatusTone = "active" | "closed" | "success" | "warning" | "danger";

const toneClasses: Record<StatusTone, { pill: string; dot: string }> = {
  active: { pill: "bg-neutral-100 text-text-primary border-transparent", dot: "bg-neutral-800" },
  closed: { pill: "bg-transparent text-text-muted border-border-strong", dot: "ring-[1.5px] ring-inset ring-current" },
  success: { pill: "bg-success-bg text-success-text border-success-border", dot: "bg-success-dot" },
  warning: { pill: "bg-warning-bg text-warning-text border-warning-border", dot: "bg-warning-dot" },
  danger: { pill: "bg-danger-bg text-danger-text border-danger-border", dot: "bg-danger-dot" },
};

interface StatusPillProps {
  tone: StatusTone;
  // Dica ao passar o mouse (ex.: "Prazo vencido há 3 dias")
  title?: string;
  size?: "sm" | "md";
  children: React.ReactNode;
}

/** Selo de status com ponto, igual em todas as telas. O tom vem de `utils/status-display.ts`. */
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
