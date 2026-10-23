import type { ReactNode } from "react";
import { Plus, type LucideIcon } from "lucide-react";
import { Button } from "./ui";

type PageHeaderStat = {
  icon: LucideIcon;
  label: string;
  value: string;
};

type PageHeaderProps = {
  icon: LucideIcon;
  title: string;
  // Linha de contexto abaixo do título ("Engenharia · 24 em andamento")
  description?: string;
  stat?: PageHeaderStat;
  actionLabel?: string;
  onAction?: () => void;
  canAct?: boolean;
  // Ações próprias da tela no lugar do botão "+ Novo" (ex.: botão secundário)
  actions?: ReactNode;
};

export function PageHeader({
  icon: Icon,
  title,
  description,
  stat,
  actionLabel,
  onAction,
  canAct = true,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
          <Icon size={18} className="text-text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight leading-6 text-text-primary truncate">{title}</h1>
          {description && <p className="text-[11px] text-text-muted truncate">{description}</p>}
        </div>
        {stat && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-muted border border-border text-xs shrink-0">
            <stat.icon size={12} className="text-text-muted" />
            <span className="text-text-secondary">{stat.label}:</span>
            <span className="font-semibold text-text-primary">{stat.value}</span>
          </span>
        )}
      </div>
      {actions}
      {canAct && actionLabel && onAction && (
        <Button icon={Plus} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
