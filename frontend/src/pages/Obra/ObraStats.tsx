import { AlertTriangle, HardHat, TrendingUp } from "lucide-react";
import { formatCurrency } from "../../utils/format-currency";

export type ObraSummary = {
  total: number;
  orcamento: number;
  executado: number;
  atrasadas: number;
};

interface ObraStatsProps {
  summary: ObraSummary;
  // Filtro "só obras com prazo vencido", ligado pelo card
  onlyOverdue: boolean;
  onToggleOverdue: () => void;
}

// Resumo sem status: o andamento de cada obra já aparece na coluna Execução
export function ObraStats({ summary, onlyOverdue, onToggleOverdue }: ObraStatsProps) {
  const pct = summary.orcamento > 0 ? Math.round((summary.executado / summary.orcamento) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
      <div className="bg-surface border border-border rounded-xl px-3 py-2.5 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
          <HardHat size={18} className="text-primary-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-text-muted leading-none">Obras</p>
          <p className="text-base font-bold text-text-primary leading-tight mt-0.5 tabular-nums">{summary.total}</p>
          <p className="text-xs text-text-muted leading-none mt-0.5 truncate tabular-nums">
            {formatCurrency(summary.orcamento)} em OS
          </p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl px-3 py-2.5 flex items-center gap-3">
        <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center shrink-0">
          <TrendingUp size={18} className="text-secondary-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs text-text-muted leading-none">Executado</p>
            <span className={`text-xs font-semibold tabular-nums ${pct > 100 ? "text-danger-text" : "text-text-secondary"}`}>
              {pct}%
            </span>
          </div>
          <p className="text-base font-bold text-text-primary leading-tight mt-0.5 truncate tabular-nums">
            {formatCurrency(summary.executado)}
          </p>
          <div className="mt-1 h-1 bg-surface-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${pct > 100 ? "bg-danger-text" : "bg-primary-500"}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        aria-pressed={onlyOverdue}
        onClick={onToggleOverdue}
        disabled={summary.atrasadas === 0 && !onlyOverdue}
        title="Mostrar só as obras com prazo vencido"
        className={`col-span-2 lg:col-span-1 bg-surface border rounded-xl px-3 py-2.5 flex items-center gap-3 text-left cursor-pointer transition-all hover:shadow-md disabled:cursor-default disabled:hover:shadow-none ${
          onlyOverdue ? "border-danger-text ring-2 ring-danger-border" : "border-border"
        }`}
      >
        <div className="w-8 h-8 bg-danger-bg rounded-lg flex items-center justify-center shrink-0">
          <AlertTriangle size={18} className="text-danger-text" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-text-muted leading-none">Prazo vencido</p>
          <p
            className={`text-base font-bold leading-tight mt-0.5 tabular-nums ${
              summary.atrasadas > 0 ? "text-danger-text" : "text-text-primary"
            }`}
          >
            {summary.atrasadas}
          </p>
          <p className="text-xs text-text-muted leading-none mt-0.5 truncate">
            {summary.atrasadas === 0 ? "nenhuma obra atrasada" : onlyOverdue ? "clique para ver todas" : "clique para filtrar"}
          </p>
        </div>
      </button>
    </div>
  );
}
