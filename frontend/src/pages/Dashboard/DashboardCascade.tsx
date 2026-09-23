import { Link } from "react-router";
import { ChevronRight, AlertTriangle } from "lucide-react";
import type { CascadeStep, CascadeGap } from "./useDashboardData";

type DashboardCascadeProps = {
  steps: CascadeStep[];
  gaps: CascadeGap[];
};

export default function DashboardCascade({ steps, gaps }: DashboardCascadeProps) {
  if (steps.length === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-xl p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-stretch gap-2">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center gap-2 flex-1 min-w-0">
            <Link
              to={step.href}
              className="flex-1 min-w-0 rounded-lg border border-border bg-surface-muted hover:border-primary-300 hover:bg-primary-50/50 transition-colors px-3.5 py-3"
            >
              <p className="text-2xl font-bold text-text-primary leading-none">{step.count}</p>
              <p className="text-xs text-text-secondary mt-1 truncate">{step.label}</p>
            </Link>
            {i < steps.length - 1 && (
              <ChevronRight size={18} className="text-text-muted shrink-0 hidden sm:block" />
            )}
          </div>
        ))}
      </div>

      {gaps.some((g) => g.count > 0) && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
          {gaps
            .filter((g) => g.count > 0)
            .map((gap) => (
              <span
                key={gap.label}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-warning-bg border border-warning-border text-warning-text text-xs font-medium"
              >
                <AlertTriangle size={12} />
                {gap.count} {gap.label}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
