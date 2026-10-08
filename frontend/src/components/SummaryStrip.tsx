import type { LucideIcon } from "lucide-react";

type Tone = "default" | "primary" | "success" | "warning" | "danger" | "muted";

export type SummaryCell = {
  key: string;
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
  icon?: LucideIcon;
  // Célula que filtra a lista: vira botão com estado ligado/desligado
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
};

const VALUE_TONE: Record<Tone, string> = {
  default: "text-text-primary",
  primary: "text-primary-600",
  success: "text-success-text",
  warning: "text-warning-text",
  danger: "text-danger-text",
  muted: "text-text-muted",
};

const ACTIVE_BG: Record<Tone, string> = {
  default: "bg-primary-50",
  primary: "bg-primary-50",
  success: "bg-success-bg",
  warning: "bg-warning-bg",
  danger: "bg-danger-bg",
  muted: "bg-surface-muted",
};

// Colunas por quantidade de células; com número ímpar, a última ocupa a linha toda enquanto há 2 colunas
const LAYOUT: Record<number, { cols: string; lastSpan: string }> = {
  3: { cols: "sm:grid-cols-3", lastSpan: "col-span-2 sm:col-span-1" },
  4: { cols: "md:grid-cols-4", lastSpan: "" },
  5: { cols: "md:grid-cols-5", lastSpan: "col-span-2 md:col-span-1" },
};

/**
 * Faixa de totais no topo das listagens (NF, OS, Obras). Os números seguem os filtros da tela;
 * detalhe por item fica no modal de cada um.
 */
// Fica no topo do card da listagem: `className` arredonda os cantos de cima no mesmo raio do card
export function SummaryStrip({ cells, className = "rounded-t-xl" }: { cells: SummaryCell[]; className?: string }) {
  const layout = LAYOUT[cells.length] ?? LAYOUT[4]!;
  return (
    // gap-px sobre fundo de borda desenha as divisórias em qualquer quebra de linha
    <div
      className={`grid grid-cols-2 ${layout.cols} gap-px bg-border border-b border-border overflow-hidden ${className}`}
    >
      {cells.map((cell, index) => {
        const tone = cell.tone ?? "default";
        const Icon = cell.icon;
        const span = index === cells.length - 1 ? layout.lastSpan : "";
        const body = (
          <>
            <p className="text-xs text-text-secondary">{cell.label}</p>
            <p
              className={`text-[17px] font-bold tabular-nums tracking-tight leading-snug inline-flex items-center gap-1.5 ${VALUE_TONE[tone]}`}
            >
              {Icon && <Icon size={15} />}
              {cell.value}
            </p>
            {cell.hint && <p className="text-[11px] text-text-muted truncate">{cell.hint}</p>}
          </>
        );

        if (cell.onClick) {
          return (
            <button
              key={cell.key}
              type="button"
              onClick={cell.onClick}
              disabled={cell.disabled}
              aria-pressed={cell.active}
              className={`${span} text-left px-4 py-3 min-w-0 transition-colors cursor-pointer disabled:cursor-default ${
                cell.active ? ACTIVE_BG[tone] : "bg-surface hover:bg-surface-muted disabled:hover:bg-surface"
              }`}
            >
              {body}
            </button>
          );
        }
        return (
          <div key={cell.key} className={`${span} bg-surface px-4 py-3 min-w-0`}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
