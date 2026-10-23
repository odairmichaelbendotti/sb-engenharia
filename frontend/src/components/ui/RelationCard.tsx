import type { ReactNode } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cx } from "../../utils/cx";
import { HINT_TEXT, type HintTone } from "../../utils/status-display";

interface RelationCardProps {
  icon: LucideIcon;
  // Tipo do vínculo, em caixa alta ("Empenho", "Ordem de serviço e obra")
  label: string;
  title: ReactNode;
  hint?: ReactNode;
  hintTone?: HintTone;
  // Bolinha na cor do contrato ao lado do título
  color?: string | null;
  // Sem onClick o cartão só informa (ex.: login sem acesso ao registro)
  onClick?: () => void;
}

/**
 * Entidade relacionada dentro de um modal de visualização. Clicar troca o conteúdo do modal
 * para o registro (com "Voltar"), sem sair da tela atual.
 */
export function RelationCard({ icon: Icon, label, title, hint, hintTone = "muted", color, onClick }: RelationCardProps) {
  const body = (
    <>
      <span className="w-8 h-8 rounded-lg bg-surface-muted border border-border flex items-center justify-center text-text-primary shrink-0">
        <Icon size={15} />
      </span>
      <span className="flex flex-col min-w-0 flex-1 text-left">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{label}</span>
        <span className="flex items-center gap-1.5 text-table font-semibold text-text-primary min-w-0">
          {color && <span aria-hidden className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />}
          <span className="truncate">{title}</span>
        </span>
        {hint && <span className={cx("text-[11px] truncate", HINT_TEXT[hintTone])}>{hint}</span>}
      </span>
      {onClick && <ChevronRight size={16} className="text-primary-300 shrink-0 group-hover:text-text-primary" />}
    </>
  );

  const base = "group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-surface min-w-0";

  if (!onClick) return <div className={base}>{body}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        base,
        "w-full cursor-pointer transition-colors hover:border-border-strong hover:bg-surface-muted/60",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary-200",
      )}
    >
      {body}
    </button>
  );
}

export function RelationGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{children}</div>;
}
