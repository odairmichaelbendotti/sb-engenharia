import { useState } from "react";
import { Link } from "react-router";
import { AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";
import type { AttentionGroup } from "./useDashboardData";

const COLLAPSED_LIMIT = 3;

type DashboardAttentionProps = {
  groups: AttentionGroup[];
};

export default function DashboardAttention({ groups }: DashboardAttentionProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <AlertCircle size={18} className="text-warning-text" />
          Atenção
        </h3>
        <p className="text-text-secondary text-sm">Pendências que você pode resolver</p>
      </div>

      {groups.length === 0 ? (
        <div className="p-4 text-center">
          <CheckCircle2 size={28} className="mx-auto text-success-text mb-2" />
          <p className="text-sm text-text-secondary">Nada pendente no momento</p>
        </div>
      ) : (
        <div className="divide-y divide-border max-h-112 overflow-y-auto">
          {groups.map((group) => {
            const isOpen = expanded.has(group.key);
            const visible = isOpen ? group.items : group.items.slice(0, COLLAPSED_LIMIT);
            const hidden = group.items.length - visible.length;

            return (
              <section key={group.key} className="py-2">
                <div className="flex items-center justify-between gap-3 px-4 py-1.5">
                  <h4 className="text-sm font-medium text-text-primary">{group.label}</h4>
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-warning-bg border border-warning-border text-warning-text text-xs font-medium">
                    {group.items.length}
                  </span>
                </div>
                <ul>
                  {visible.map((item) => (
                    <li key={item.id}>
                      <Link
                        to={item.href}
                        className="flex items-center justify-between gap-3 px-4 py-1.5 hover:bg-surface-muted transition-colors"
                      >
                        <span className="text-sm text-text-secondary truncate">{item.label}</span>
                        <span className="text-xs text-warning-text font-medium shrink-0">{item.meta}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {group.items.length > COLLAPSED_LIMIT && (
                  <button
                    type="button"
                    onClick={() => toggle(group.key)}
                    className="cursor-pointer mx-4 mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-500"
                  >
                    <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    {isOpen ? "Mostrar menos" : `Mostrar mais ${hidden}`}
                  </button>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
