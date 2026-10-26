import { useState } from "react";
import { Link } from "react-router";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import type { AttentionGroup, AttentionItem } from "./useDashboardData";
import { useEntityViewer } from "../../store/entityViewer";
import { StatusPill } from "../../components/ui";
import { cx } from "../../utils/cx";

const COLLAPSED_LIMIT = 3;

// Mesma cor das dicas de prazo das tabelas
const META_TEXT: Record<AttentionItem["tone"], string> = {
  danger: "text-danger-text font-semibold",
  warning: "text-warning-text font-semibold",
  active: "text-text-secondary font-semibold",
};

type DashboardAttentionProps = {
  groups: AttentionGroup[];
};

export default function DashboardAttention({ groups }: DashboardAttentionProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const openViewer = useEntityViewer((s) => s.open);

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const rowClass =
    "w-full flex items-center justify-between gap-3 px-4 py-1.5 text-left cursor-pointer hover:bg-surface-muted transition-colors";

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <AlertCircle size={16} className="text-text-muted" />
          Atenção
        </h3>
        <p className="text-text-muted text-xs mt-0.5">Pendências que você pode resolver · clique para abrir</p>
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
            // O selo do grupo leva a cor do item mais grave
            const tone = group.items.some((i) => i.tone === "danger")
              ? "danger"
              : group.items.some((i) => i.tone === "warning")
                ? "warning"
                : "active";

            return (
              <section key={group.key} className="py-2">
                <div className="flex items-center justify-between gap-3 px-4 py-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{group.label}</h4>
                  <StatusPill tone={tone} size="sm">
                    {group.items.length}
                  </StatusPill>
                </div>
                <ul>
                  {visible.map((item) => {
                    const content = (
                      <>
                        <span className="text-sm text-text-primary truncate">{item.label}</span>
                        <span className="flex items-center gap-1 shrink-0">
                          <span className={cx("text-[11px]", META_TEXT[item.tone])}>{item.meta}</span>
                          <ChevronRight size={14} className="text-primary-300" />
                        </span>
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
                {group.items.length > COLLAPSED_LIMIT && (
                  <button
                    type="button"
                    onClick={() => toggle(group.key)}
                    className="cursor-pointer mx-4 mt-1 inline-flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary"
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
