import { Link } from "react-router";
import { Building2 } from "lucide-react";
import { formatCurrency } from "../../utils/format-currency";
import type { TenantSummaryEntry } from "../../../types/tenant";

type DashboardTenantSummaryProps = {
  entries: TenantSummaryEntry[];
};

export default function DashboardTenantSummary({ entries }: DashboardTenantSummaryProps) {
  if (entries.length === 0) return null;

  const total = entries.reduce(
    (acc, e) => ({
      contratosAtivos: acc.contratosAtivos + e.stats.contratosAtivos,
      empenhosAtivos: acc.empenhosAtivos + e.stats.empenhosAtivos,
      osAtivas: acc.osAtivas + e.stats.osAtivas,
      obrasEmAndamento: acc.obrasEmAndamento + e.stats.obrasEmAndamento,
      valorExecutadoTotal: acc.valorExecutadoTotal + e.stats.valorExecutadoTotal,
    }),
    { contratosAtivos: 0, empenhosAtivos: 0, osAtivas: 0, obrasEmAndamento: 0, valorExecutadoTotal: 0 },
  );

  return (
    <div className="bg-surface border border-border rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Building2 size={16} className="text-primary-500" />
        <h3 className="font-semibold text-text-primary text-sm">Resumo por instituição</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4 pb-4 border-b border-border">
        <div>
          <p className="text-lg font-bold text-text-primary">{entries.length}</p>
          <p className="text-xs text-text-muted">Instituições</p>
        </div>
        <div>
          <p className="text-lg font-bold text-text-primary">{total.contratosAtivos}</p>
          <p className="text-xs text-text-muted">Contratos ativos</p>
        </div>
        <div>
          <p className="text-lg font-bold text-text-primary">{total.empenhosAtivos}</p>
          <p className="text-xs text-text-muted">Empenhos ativos</p>
        </div>
        <div>
          <p className="text-lg font-bold text-text-primary">{total.obrasEmAndamento}</p>
          <p className="text-xs text-text-muted">Obras em andamento</p>
        </div>
        <div>
          <p className="text-lg font-bold text-text-primary">{formatCurrency(total.valorExecutadoTotal)}</p>
          <p className="text-xs text-text-muted">Executado em obras</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {entries.map((entry) => (
          <Link
            key={entry.tenant.id}
            to={`/organizacoes/${entry.tenant.id}`}
            className="rounded-lg border border-border hover:border-primary-300 hover:bg-primary-50/50 transition-colors p-3"
          >
            <p className="font-semibold text-text-primary text-sm truncate mb-2">{entry.tenant.name}</p>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div>
                <p className="text-sm font-bold text-text-primary">{entry.stats.contratosAtivos}</p>
                <p className="text-[10px] text-text-muted">Contratos</p>
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">{entry.stats.empenhosAtivos}</p>
                <p className="text-[10px] text-text-muted">Empenhos</p>
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">{entry.stats.obrasEmAndamento}</p>
                <p className="text-[10px] text-text-muted">Obras</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
