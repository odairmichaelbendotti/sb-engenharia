import { ClipboardList, Activity, CheckCircle2, XCircle } from "lucide-react";
import { StatCard } from "../../components/StatCard";

interface OrdemServicoStatsProps {
  metrics: {
    total: number;
    ativas: number;
    finalizadas: number;
    canceladas: number;
    valorTotal: number;
  };
  formatCurrency: (value: number) => string;
}

export function OrdemServicoStats({ metrics, formatCurrency }: OrdemServicoStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
      <StatCard
        title="Total de OS"
        value={metrics.total.toString()}
        subtitle={formatCurrency(metrics.valorTotal)}
        icon={<ClipboardList size={18} className="text-primary-500" />}
        color="bg-primary-100"
        iconRounded="rounded-lg"
        compact
        emphasize
      />
      <StatCard
        title="Ativas"
        value={metrics.ativas.toString()}
        subtitle="Em vigência"
        icon={<Activity size={18} className="text-warning-text" />}
        color="bg-warning-bg"
        iconRounded="rounded-lg"
        compact
      />
      <StatCard
        title="Finalizadas"
        value={metrics.finalizadas.toString()}
        subtitle="Encerradas"
        icon={<CheckCircle2 size={18} className="text-success-text" />}
        color="bg-success-bg"
        iconRounded="rounded-lg"
        compact
      />
      <StatCard
        title="Canceladas"
        value={metrics.canceladas.toString()}
        subtitle="Canceladas"
        icon={<XCircle size={18} className="text-danger-text" />}
        color="bg-danger-bg"
        iconRounded="rounded-lg"
        compact
      />
    </div>
  );
}
