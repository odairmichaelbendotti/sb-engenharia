import { LayoutDashboard, Globe, Loader2, AlertTriangle } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { useDashboardData } from "./useDashboardData";
import DashboardCascade from "./DashboardCascade";
import DashboardStats from "./DashboardStats";
import DashboardAttention from "./DashboardAttention";
import DashboardActivity from "./DashboardActivity";
import DashboardPlatform from "./DashboardPlatform";

export default function Dashboard() {
  const {
    isLoading,
    hasLoadError,
    tenantName,
    canViewAdministrativo,
    canViewEngenharia,
    canManageOrganization,
    engenhariaFirst,
    tenantsSummary,
    cascade,
    kpis,
    attention,
    activity,
  } = useDashboardData();

  return (
    <div className="p-4 md:p-5 max-w-7xl mx-auto">
      <PageHeader
        icon={canManageOrganization ? Globe : LayoutDashboard}
        title={canManageOrganization ? "Plataforma" : (tenantName ?? "Dashboard")}
      />

      {hasLoadError && !isLoading && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-warning-border bg-warning-bg px-4 py-2.5 text-sm text-warning-text">
          <AlertTriangle size={16} className="shrink-0" />
          Parte dos dados não pôde ser carregada. Alguns números podem estar incompletos — recarregue a página.
        </div>
      )}

      {isLoading ? (
        <div className="bg-surface border border-border rounded-lg p-8 flex flex-col items-center justify-center">
          <Loader2 size={32} className="text-primary-500 animate-spin mb-3" />
          <p className="text-text-secondary text-sm">Carregando dashboard...</p>
        </div>
      ) : canManageOrganization ? (
        <DashboardPlatform entries={tenantsSummary} />
      ) : (
        <>
          <DashboardCascade steps={cascade} />

          <DashboardStats
            canViewAdministrativo={canViewAdministrativo}
            canViewEngenharia={canViewEngenharia}
            engenhariaFirst={engenhariaFirst}
            empresasComContratoAtivo={kpis.empresasComContratoAtivo}
            notasPendentesVencidas={kpis.notasPendentesVencidas}
            saldoEmpenhosAtivo={kpis.saldoEmpenhosAtivo}
            orcamentoObras={kpis.orcamentoObras}
            valorExecutadoObras={kpis.valorExecutadoObras}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <DashboardAttention groups={attention} />
            <DashboardActivity items={activity} />
          </div>
        </>
      )}
    </div>
  );
}
