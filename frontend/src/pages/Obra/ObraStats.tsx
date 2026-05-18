import { HardHat, Activity, CheckCircle2, PauseCircle, XCircle } from "lucide-react";
import { StatCard } from "../../components/StatCard";
import type { ObraStats as ObraStatsType } from "../../../types/obra";

interface ObraStatsProps {
  stats: ObraStatsType;
  formatCurrency: (v: number) => string;
}

export function ObraStats({ stats, formatCurrency }: ObraStatsProps) {
  const execucaoPercent =
    stats.orcamentoTotal > 0
      ? Math.round((stats.valorExecutadoTotal / stats.orcamentoTotal) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <StatCard
        title="Total de Obras"
        value={stats.total.toString()}
        subtitle={formatCurrency(stats.orcamentoTotal)}
        icon={<HardHat size={24} className="text-primary-500" />}
        color="bg-primary-100"
      />
      <StatCard
        title="Em Andamento"
        value={stats.emAndamento.toString()}
        subtitle="obras ativas"
        icon={<Activity size={24} className="text-warning-text" />}
        color="bg-warning-bg"
      />
      <StatCard
        title="Concluídas"
        value={stats.concluidas.toString()}
        subtitle="obras finalizadas"
        icon={<CheckCircle2 size={24} className="text-success-text" />}
        color="bg-success-bg"
      />
      <StatCard
        title="Paralisadas"
        value={stats.paralisadas.toString()}
        subtitle="aguardando retomada"
        icon={<PauseCircle size={24} className="text-danger-text" />}
        color="bg-danger-bg"
      />
      <div className="bg-surface border border-border rounded-xl p-5 hover:shadow-lg transition-shadow">
        <p className="text-text-secondary text-sm font-medium">Execução Financeira</p>
        <p className="text-2xl font-bold text-text-primary mt-1">
          {execucaoPercent}%
        </p>
        <div className="mt-2">
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                execucaoPercent >= 90
                  ? "bg-danger-text"
                  : execucaoPercent >= 60
                    ? "bg-warning-text"
                    : "bg-primary-500"
              }`}
              style={{ width: `${Math.min(execucaoPercent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-text-muted mt-1.5">
            {formatCurrency(stats.valorExecutadoTotal)} de {formatCurrency(stats.orcamentoTotal)}
          </p>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <XCircle size={12} className="text-text-muted" />
          <span className="text-xs text-text-muted">{stats.canceladas} cancelada(s)</span>
        </div>
      </div>
    </div>
  );
}
