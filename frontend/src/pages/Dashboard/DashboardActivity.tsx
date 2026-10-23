import { Link } from "react-router";
import { Clock, FileSignature, Layers2, ClipboardList, HardHat, Receipt } from "lucide-react";
import { formatDateTime } from "../../utils/format-currency";
import type { ActivityItem } from "./useDashboardData";
import { useEntityViewer } from "../../store/entityViewer";

const TYPE_ICON: Record<ActivityItem["type"], typeof FileSignature> = {
  contrato: FileSignature,
  empenho: Layers2,
  os: ClipboardList,
  obra: HardHat,
  invoice: Receipt,
};

type DashboardActivityProps = {
  items: ActivityItem[];
};

export default function DashboardActivity({ items }: DashboardActivityProps) {
  const openViewer = useEntityViewer((s) => s.open);
  const rowClass = "w-full flex items-center gap-3 px-4 py-2 text-left cursor-pointer hover:bg-surface-muted transition-colors";

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Clock size={16} className="text-text-muted" />
          Atividade recente
        </h3>
        <p className="text-text-muted text-xs mt-0.5">Últimos registros criados · clique para abrir</p>
      </div>

      {items.length === 0 ? (
        <p className="p-4 text-center text-sm text-text-secondary">Nenhum registro ainda</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => {
            const Icon = TYPE_ICON[item.type];
            const content = (
              <>
                  <div className="w-8 h-8 rounded-lg bg-surface-muted border border-border flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-primary truncate">
                      {item.typeLabel} <span className="font-medium">{item.label}</span>
                    </p>
                    <p className="text-xs text-text-muted">{formatDateTime(item.createdAt)}</p>
                  </div>
              </>
            );
            return (
              <li key={item.id}>
                {item.entity ? (
                  <button type="button" onClick={() => openViewer(item.entity!)} className={rowClass}>
                    {content}
                  </button>
                ) : (
                  <Link to={item.href} className={rowClass}>
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
