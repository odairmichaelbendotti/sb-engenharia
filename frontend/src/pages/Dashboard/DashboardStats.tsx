import { Building2, Layers2, DollarSign, FileText } from "lucide-react";
import { StatCard } from "../../components/StatCard";
import { formatCurrency } from "../../utils/format-currency";

type DashboardStatsProps = {
  totalEmpresas: number;
  totalEmpenhos: number;
  valorEmpenhosAtivos: number;
  totalNF: number;
};

export default function DashboardStats({
  totalEmpresas,
  totalEmpenhos,
  valorEmpenhosAtivos,
  totalNF,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Empresas Cadastradas"
        value={totalEmpresas.toString()}
        subtitle="Cadastros ativos"
        change="+2 este mês"
        changeType="positive"
        icon={<Building2 size={24} className="text-primary-500" />}
        color="bg-primary-100"
      />
      <StatCard
        title="Empenhos Ativos"
        value={totalEmpenhos.toString()}
        subtitle="Em andamento"
        change="3 concluídos"
        changeType="neutral"
        icon={<Layers2 size={24} className="text-success-text" />}
        color="bg-success-bg"
      />
      <StatCard
        title="Valor em Empenhos"
        value={formatCurrency(valorEmpenhosAtivos)}
        subtitle="Total empenhado"
        change="+12% vs mês anterior"
        changeType="positive"
        icon={<DollarSign size={24} className="text-accent-500" />}
        color="bg-accent-100"
      />
      <StatCard
        title="Notas Fiscais"
        value={totalNF.toString()}
        subtitle="Emitidas"
        change="2 pendentes"
        changeType="negative"
        icon={<FileText size={24} className="text-warning-text" />}
        color="bg-warning-bg"
      />
    </div>
  );
}
