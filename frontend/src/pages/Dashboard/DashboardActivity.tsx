import { Link } from "react-router";
import { Clock, FileSignature, Layers2, ClipboardList, HardHat, Receipt } from "lucide-react";
import { formatDateTime } from "../../utils/format-currency";
import type { ActivityItem } from "./useDashboardData";

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
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Clock size={18} className="text-primary-500" />
          Atividade recente
        </h3>
        <p className="text-text-secondary text-sm">Últimos registros criados</p>
      </div>

      {items.length === 0 ? (
        <p className="p-4 text-center text-sm text-text-secondary">Nenhum registro ainda</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => {
            const Icon = TYPE_ICON[item.type];
            return (
              <li key={item.id}>
                <Link
                  to={item.href}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-surface-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-primary-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-primary truncate">
                      {item.typeLabel} <span className="font-medium">{item.label}</span>
                    </p>
                    <p className="text-xs text-text-muted">{formatDateTime(item.createdAt)}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
