import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cx } from "../../utils/cx";

interface GroupHeaderProps {
  // Nome do grupo; com `editable`, o próprio campo de edição (aí só a seta abre e fecha)
  title: ReactNode;
  editable?: boolean;
  // Texto curto depois do título (ex.: "4 itens")
  count?: string;
  // Valores à direita (subtotais)
  meta?: ReactNode;
  // Botões no fim da faixa
  actions?: ReactNode;
  open: boolean;
  onToggle: () => void;
  className?: string;
}

/**
 * Faixa de um grupo que abre e fecha (accordion), num tom neutro diferente das linhas: etapas do
 * orçamento e da medição. Em tabela, usar `TableGroupRow`.
 */
export function GroupHeader({ title, editable = false, count, meta, actions, open, onToggle, className }: GroupHeaderProps) {
  const label = typeof title === "string" ? title : "grupo";
  return (
    <div className={cx("flex items-center gap-2 min-h-9 rounded-lg bg-neutral-100 px-2 text-text-primary", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-label={editable ? `${open ? "Recolher" : "Expandir"} ${label}` : undefined}
        onClick={onToggle}
        className={cx(
          "flex items-center gap-2 min-w-0 h-8 rounded-md cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-primary-500",
          !editable && "flex-1",
        )}
      >
        <ChevronRight
          size={14}
          className={cx("shrink-0 text-text-secondary transition-transform", open && "rotate-90")}
          aria-hidden
        />
        {!editable && (
          <>
            <span className="truncate text-[11px] font-semibold uppercase tracking-wide" title={label}>
              {title}
            </span>
            {count && <span className="shrink-0 text-[11px] text-text-muted">{count}</span>}
          </>
        )}
      </button>
      {editable && (
        <>
          <div className="min-w-0 flex-1">{title}</div>
          {count && <span className="shrink-0 text-[11px] text-text-muted">{count}</span>}
        </>
      )}
      {meta && <div className="shrink-0 text-[11px] text-text-secondary tabular-nums">{meta}</div>}
      {actions && <div className="shrink-0 flex items-center gap-1">{actions}</div>}
    </div>
  );
}
