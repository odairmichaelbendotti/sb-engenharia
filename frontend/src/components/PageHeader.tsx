import { Plus, type LucideIcon } from "lucide-react";

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
        <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
          <Icon size={18} className="text-primary-500" />
        </div>
        <h1 className="text-lg font-bold text-text-primary truncate">{title}</h1>
        {stat && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-muted border border-border text-xs shrink-0">
            <stat.icon size={12} className="text-accent-500" />
            <span className="text-text-secondary">{stat.label}:</span>
            <span className="font-semibold text-text-primary">{stat.value}</span>
          </span>
        )}
      </div>
      {canAct && actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center cursor-pointer justify-center gap-2 px-3.5 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium shrink-0"
        >
          <Plus size={16} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
