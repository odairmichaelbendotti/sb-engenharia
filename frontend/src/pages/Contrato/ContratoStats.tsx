import { FileSignature, Activity, CheckCircle2, XCircle } from "lucide-react";
import { StatCard } from "../../components/StatCard";

interface ContratoStatsProps {
  metrics: {
    total: number;
    ativos: number;
    finalizados: number;
    cancelados: number;
    valorTotal: number;
  };
  formatCurrency: (value: number) => string;
}

export function ContratoStats({ metrics, formatCurrency }: ContratoStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
      <StatCard
        title="Total de Contratos"
        value={metrics.total.toString()}
        subtitle={formatCurrency(metrics.valorTotal)}
        icon={<FileSignature size={18} className="text-primary-500" />}
        color="bg-primary-100"
        iconRounded="rounded-lg"
        compact
        emphasize
      />
      <StatCard
        title="Ativos"
        value={metrics.ativos.toString()}
        subtitle="Em vigência"
        icon={<Activity size={18} className="text-warning-text" />}
        color="bg-warning-bg"
        iconRounded="rounded-lg"
        compact
      />
      <StatCard
        title="Finalizados"
        value={metrics.finalizados.toString()}
        subtitle="Encerrados"
        icon={<CheckCircle2 size={18} className="text-success-text" />}
        color="bg-success-bg"
        iconRounded="rounded-lg"
        compact
      />
      <StatCard
        title="Cancelados"
        value={metrics.cancelados.toString()}
        subtitle="Cancelados"
        icon={<XCircle size={18} className="text-danger-text" />}
        color="bg-danger-bg"
        iconRounded="rounded-lg"
        compact
      />
    </div>
  );
}
