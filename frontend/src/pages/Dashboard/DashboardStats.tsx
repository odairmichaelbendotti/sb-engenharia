import { Building2, Receipt, Wallet, HardHat } from "lucide-react";
import { StatCard } from "../../components/StatCard";
import { formatCurrency } from "../../utils/format-currency";

type DashboardStatsProps = {
  canViewAdministrativo: boolean;
  canViewEngenharia: boolean;
  empresasComContratoAtivo: number;
  notasPendentesVencidas: { count: number; value: number };
  saldoEmpenhosAtivo: number;
  orcamentoObras: number;
  valorExecutadoObras: number;
};

export default function DashboardStats({
  canViewAdministrativo,
  canViewEngenharia,
  empresasComContratoAtivo,
  notasPendentesVencidas,
  saldoEmpenhosAtivo,
  orcamentoObras,
  valorExecutadoObras,
}: DashboardStatsProps) {
  if (!canViewAdministrativo && !canViewEngenharia) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      {canViewAdministrativo && (
        <>
          <StatCard
            title="Empresas com contrato ativo"
            value={empresasComContratoAtivo.toString()}
            subtitle="Vinculadas a contratos ativos"
            icon={<Building2 size={24} className="text-primary-500" />}
            color="bg-primary-100"
          />
          <StatCard
            title="Notas fiscais pendentes/vencidas"
            value={notasPendentesVencidas.count.toString()}
            subtitle={formatCurrency(notasPendentesVencidas.value)}
            icon={<Receipt size={24} className="text-warning-text" />}
            color="bg-warning-bg"
          />
          <StatCard
            title="Saldo de empenhos ativos"
            value={formatCurrency(saldoEmpenhosAtivo)}
            subtitle="Disponível pra empenhar"
            icon={<Wallet size={24} className="text-success-text" />}
            color="bg-success-bg"
          />
        </>
      )}
      {canViewEngenharia && (
        <StatCard
          title="Execução de obras"
          value={formatCurrency(valorExecutadoObras)}
          subtitle={`de ${formatCurrency(orcamentoObras)} orçados`}
          icon={<HardHat size={24} className="text-accent-500" />}
          color="bg-accent-100"
        />
      )}
    </div>
  );
}
