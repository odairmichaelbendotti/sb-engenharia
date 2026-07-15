import { Layers2, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import { StatCard } from "../../components/StatCard";

interface EmpenhoStatsProps {
  metrics: {
    total: number;
    totalValue: number;
    ativo: number;
    ativoValue: number;
    concluido: number;
    concluidoValue: number;
    cancelado: number;
    canceladoValue: number;
  };
  formatCurrency: (value: number) => string;
}

export function EmpenhoStats({ metrics, formatCurrency }: EmpenhoStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
      <StatCard
        title="Total de Empenhos"
        value={metrics.total.toString()}
        subtitle="Todos os empenhos"
        icon={<Layers2 size={18} className="text-primary-500" />}
        color="bg-primary-100"
        iconRounded="rounded-lg"
        compact
        emphasize
      />
      <StatCard
        title="Ativos"
        value={metrics.ativo.toString()}
        subtitle={formatCurrency(metrics.ativoValue)}
        icon={<TrendingUp size={18} className="text-warning-text" />}
        color="bg-warning-bg"
        iconRounded="rounded-lg"
        compact
      />
      <StatCard
        title="Concluídos"
        value={metrics.concluido.toString()}
        subtitle={formatCurrency(metrics.concluidoValue)}
        icon={<CheckCircle2 size={18} className="text-success-text" />}
        color="bg-success-bg"
        iconRounded="rounded-lg"
        compact
      />
      <StatCard
        title="Cancelados"
        value={metrics.cancelado.toString()}
        subtitle={formatCurrency(metrics.canceladoValue)}
        icon={<XCircle size={18} className="text-danger-text" />}
        color="bg-danger-bg"
        iconRounded="rounded-lg"
        compact
      />
    </div>
  );
}
