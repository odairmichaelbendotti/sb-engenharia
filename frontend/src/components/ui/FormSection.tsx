import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "../../utils/cx";

interface FormSectionProps {
  title: ReactNode;
  icon?: LucideIcon;
  // Ação alinhada à direita do título (ex.: "Adicionar lote")
  action?: ReactNode;
  // Quantidade de itens da seção (ex.: notas fiscais), à direita da linha
  count?: number;
  className?: string;
  children: ReactNode;
}

// Bloco de campos com título e linha divisória; os campos ficam com espaçamento vertical padrão
export function FormSection({ title, icon: Icon, action, count, className, children }: FormSectionProps) {
  return (
    <section className={cx("space-y-4", className)}>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={14} className="text-text-muted shrink-0" />}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{title}</h3>
        <div className="flex-1 h-px bg-border" />
        {count !== undefined && <span className="text-[11px] font-semibold text-text-secondary tabular-nums">{count}</span>}
        {action}
      </div>
      {children}
    </section>
  );
}
