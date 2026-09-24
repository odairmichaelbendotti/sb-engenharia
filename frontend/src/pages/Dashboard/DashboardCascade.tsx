import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import type { CascadeStep } from "./useDashboardData";

type DashboardCascadeProps = {
  steps: CascadeStep[];
};

export default function DashboardCascade({ steps }: DashboardCascadeProps) {
  if (steps.length === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-xl p-3 mb-3">
      <div className="flex flex-col sm:flex-row sm:items-stretch gap-2">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center gap-2 flex-1 min-w-0">
            <Link
              to={step.href}
              className="flex-1 min-w-0 rounded-lg border border-border bg-surface-muted hover:border-primary-300 hover:bg-primary-50/50 transition-colors px-3 py-2"
            >
              <p className="text-xl font-bold text-text-primary leading-none">{step.count}</p>
              <p className="text-xs text-text-secondary mt-1 truncate">{step.label}</p>
            </Link>
            {i < steps.length - 1 && (
              <ChevronRight size={18} className="text-text-muted shrink-0 hidden sm:block" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
