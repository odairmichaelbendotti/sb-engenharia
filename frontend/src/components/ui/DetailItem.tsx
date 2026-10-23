import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "../../utils/cx";

interface DetailItemProps {
  icon?: LucideIcon;
  label: string;
  // Texto longo (descrição): peso normal e cor secundária
  long?: boolean;
  className?: string;
  children: ReactNode;
}

// Rótulo + valor nos modais de visualização ("Responsável técnico", "CNPJ"...)
export function DetailItem({ icon: Icon, label, long = false, className, children }: DetailItemProps) {
  return (
    <div className={cx("flex items-start gap-2 min-w-0", className)}>
      {Icon && <Icon size={14} className="text-text-muted mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-[11px] text-text-muted leading-3.5">{label}</p>
        <div
          className={cx(
            "text-sm mt-1 wrap-break-word",
            long ? "text-text-secondary whitespace-pre-line" : "font-medium text-text-primary",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// Grade de itens: uma coluna no celular, duas ou três no desktop
export function DetailGrid({ columns = 3, children }: { columns?: 2 | 3; children: ReactNode }) {
  return (
    <div className={cx("grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5", columns === 3 && "lg:grid-cols-3")}>
      {children}
    </div>
  );
}
