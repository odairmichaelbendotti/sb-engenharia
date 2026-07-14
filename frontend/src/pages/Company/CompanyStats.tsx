import { Building2, Layers2 } from "lucide-react";
import { StatCard } from "../../components/StatCard";
import { formatCurrency } from "../../utils/format-currency";
import type { StatsCompany } from "../../../types/list-companies";

type CompanyStatsProps = {
  stats: StatsCompany | null;
};

export default function CompanyStats({ stats }: CompanyStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
      <StatCard
        title="Total de Empresas"
        value={stats?.totalCompanies.toString() || "0"}
        subtitle="Cadastradas"
        icon={<Building2 size={18} className="text-primary-500" />}
        color="bg-primary-100"
        iconRounded="rounded-lg"
        compact
      />
      <StatCard
        title="Total de Empenhos"
        value={stats?.totalEmpenhos.toString() || "0"}
        subtitle="Vinculados"
        icon={<Layers2 size={18} className="text-secondary-500" />}
        color="bg-secondary-100"
        iconRounded="rounded-lg"
        compact
      />
      <StatCard
        title="Empenhos Ativos"
        value={stats?.totalEmpenhosActive.toString() || "0"}
        subtitle="Em andamento"
        icon={<Layers2 size={18} className="text-success-text" />}
        color="bg-success-bg"
        iconRounded="rounded-lg"
        compact
      />
      <StatCard
        title="Valor Total"
        value={formatCurrency(stats?.totalEmpenhosValue || 0)}
        subtitle="Empenhado"
        icon={<span className="text-accent-500 font-bold text-sm">R$</span>}
        color="bg-accent-100"
        iconRounded="rounded-lg"
        compact
      />
    </div>
  );
}
