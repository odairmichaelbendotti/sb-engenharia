import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  color: string;
  iconRounded?: "rounded-xl" | "rounded-full";
}

export function StatCard({
  title,
  value,
  subtitle,
  change,
  changeType,
  icon,
  color,
  iconRounded = "rounded-xl",
}: StatCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-text-secondary text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-text-primary mt-1 truncate">
            {value}
          </p>
          {change ? (
            <div
              className={`flex items-center gap-1 mt-1 text-sm ${
                changeType === "positive"
                  ? "text-success-text"
                  : changeType === "negative"
                    ? "text-danger-text"
                    : "text-text-secondary"
              }`}
            >
              {changeType === "positive" ? (
                <ArrowUpRight size={16} />
              ) : changeType === "negative" ? (
                <ArrowDownRight size={16} />
              ) : null}
              <span>{change}</span>
            </div>
          ) : (
            <p className="text-sm text-text-secondary mt-1 truncate">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`w-12 h-12 ${color} ${iconRounded} flex items-center justify-center shrink-0 ml-3`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
