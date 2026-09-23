import { Link } from "react-router";
import { LayoutDashboard, Building2, Loader2 } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { useDashboardData } from "./useDashboardData";
import DashboardCascade from "./DashboardCascade";
import DashboardStats from "./DashboardStats";
import DashboardAttention from "./DashboardAttention";
import DashboardActivity from "./DashboardActivity";
import DashboardTenantSummary from "./DashboardTenantSummary";

export default function Dashboard() {
  const {
    isLoading,
    tenantName,
    canViewAdministrativo,
    canViewEngenharia,
    canManageOrganization,
    tenantsSummary,
    cascade,
    kpis,
    attention,
    activity,
  } = useDashboardData();

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader icon={LayoutDashboard} title={tenantName ?? "Dashboard"} />

      {canManageOrganization && (
        <Link
          to="/organizacoes"
          className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline mb-3"
        >
          <Building2 size={14} />
          Ver organizações
        </Link>
      )}

      {isLoading ? (
        <div className="bg-surface border border-border rounded-lg p-12 flex flex-col items-center justify-center">
          <Loader2 size={32} className="text-primary-500 animate-spin mb-3" />
          <p className="text-text-secondary text-sm">Carregando dashboard...</p>
        </div>
      ) : (
        <>
          {canManageOrganization && <DashboardTenantSummary entries={tenantsSummary} />}

          <DashboardCascade steps={cascade.steps} gaps={cascade.gaps} />

          <DashboardStats
            canViewAdministrativo={canViewAdministrativo}
            canViewEngenharia={canViewEngenharia}
            empresasComContratoAtivo={kpis.empresasComContratoAtivo}
            notasPendentesVencidas={kpis.notasPendentesVencidas}
            saldoEmpenhosAtivo={kpis.saldoEmpenhosAtivo}
            orcamentoObras={kpis.orcamentoObras}
            valorExecutadoObras={kpis.valorExecutadoObras}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DashboardAttention items={attention} />
            <DashboardActivity items={activity} />
          </div>
        </>
      )}
    </div>
  );
}
