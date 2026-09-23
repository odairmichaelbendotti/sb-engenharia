import { Link } from "react-router";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { AttentionItem } from "./useDashboardData";

type DashboardAttentionProps = {
  items: AttentionItem[];
};

export default function DashboardAttention({ items }: DashboardAttentionProps) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <AlertCircle size={18} className="text-warning-text" />
          Atenção
        </h3>
        <p className="text-text-secondary text-sm">Itens que precisam de ação</p>
      </div>

      {items.length === 0 ? (
        <div className="p-6 text-center">
          <CheckCircle2 size={28} className="mx-auto text-success-text mb-2" />
          <p className="text-sm text-text-secondary">Nada pendente no momento</p>
        </div>
      ) : (
        <ul className="divide-y divide-border max-h-96 overflow-y-auto">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={item.href}
                className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-surface-muted transition-colors"
              >
                <span className="text-sm text-text-primary truncate">{item.label}</span>
                <span className="text-xs text-warning-text font-medium shrink-0">{item.meta}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
