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
  stat?: PageHeaderStat;
  actionLabel?: string;
  onAction?: () => void;
  canAct?: boolean;
};

export function PageHeader({
  icon: Icon,
  title,
  stat,
  actionLabel,
  onAction,
  canAct = true,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
          <Icon size={18} className="text-text-primary" />
        </div>
        <h1 className="text-lg font-semibold tracking-tight text-text-primary truncate">{title}</h1>
        {stat && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-muted border border-border text-xs shrink-0">
            <stat.icon size={12} className="text-text-muted" />
            <span className="text-text-secondary">{stat.label}:</span>
            <span className="font-semibold text-text-primary">{stat.value}</span>
          </span>
        )}
      </div>
      {canAct && actionLabel && onAction && (
        <Button icon={Plus} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
