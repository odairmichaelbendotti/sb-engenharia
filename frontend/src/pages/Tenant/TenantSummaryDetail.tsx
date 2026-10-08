import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Building2 } from "lucide-react";
import { useTenants } from "../../store/tenants";
import { SummaryStrip } from "../../components/SummaryStrip";
import { formatCurrency } from "../../utils/format-currency";

export default function TenantSummaryDetail() {
  const { tenantId } = useParams();
  const { tenantsSummary, fetchTenantsSummary } = useTenants();

  useEffect(() => {
    if (tenantsSummary.length === 0) {
      fetchTenantsSummary().catch(() => {});
    }
  }, [tenantsSummary.length, fetchTenantsSummary]);

  const entry = useMemo(
    () => tenantsSummary.find((e) => e.tenant.id === tenantId) ?? null,
    [tenantsSummary, tenantId],
  );

  return (
    <div className="p-4 md:p-5 max-w-5xl mx-auto">
      <Link
        to="/organizacoes"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-3"
      >
        <ArrowLeft size={14} />
        Voltar para organizações
      </Link>

      {!entry ? (
        <div className="bg-surface border border-border rounded-lg p-8 flex flex-col items-center justify-center text-center">
          <Building2 size={32} className="text-text-muted mb-2" />
          <p className="text-text-secondary text-sm">
            Instituição não encontrada, ou ainda carregando os dados.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-primary-500" />
            </div>
            <h1 className="text-lg font-bold text-text-primary truncate">{entry.tenant.name}</h1>
          </div>

          <p className="text-xs text-text-muted mb-3">
            Resumo agregado. Os registros desta organização aparecem nas listagens de Contratos,
            Empenhos, Ordens de Serviço, Obras e Notas fiscais.
          </p>

          <SummaryStrip
            standalone
            cells={[
              {
                key: "contratos",
                label: "Contratos ativos",
                value: String(entry.stats.contratosAtivos),
                hint: `${entry.stats.osAtivas} ${entry.stats.osAtivas === 1 ? "OS ativa" : "OS ativas"}`,
              },
              {
                key: "empenhos",
                label: "Empenhos ativos",
                value: formatCurrency(entry.stats.empenhosAtivosValor),
                hint: `${entry.stats.empenhosAtivos} empenhos`,
              },
              {
                key: "obras",
                label: "Liquidado em obras",
                value: formatCurrency(entry.stats.valorExecutadoTotal),
                hint: `de ${formatCurrency(entry.stats.orcamentoTotal)} · ${entry.stats.obrasEmAndamento} em andamento`,
              },
              {
                key: "notas",
                label: "Notas pendentes/vencidas",
                value: formatCurrency(entry.stats.notasPendentesVencidasValor),
                hint: `${entry.stats.notasPendentesVencidasCount} notas`,
                tone: entry.stats.notasPendentesVencidasCount > 0 ? "warning" : "default",
              },
            ]}
          />
        </>
      )}
    </div>
  );
}
