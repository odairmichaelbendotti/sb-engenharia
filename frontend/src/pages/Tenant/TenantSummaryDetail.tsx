import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Building2,
  FileSignature,
  Layers2,
  ClipboardList,
  HardHat,
  Receipt,
  Wallet,
} from "lucide-react";
import { useTenants } from "../../store/tenants";
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
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <Link
        to="/organizacoes"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-3"
      >
        <ArrowLeft size={14} />
        Voltar para organizações
      </Link>

      {!entry ? (
        <div className="bg-surface border border-border rounded-lg p-12 flex flex-col items-center justify-center text-center">
          <Building2 size={40} className="text-text-muted mb-3" />
          <p className="text-text-secondary text-sm">
            Instituição não encontrada, ou ainda carregando os dados.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-primary-500" />
            </div>
            <h1 className="text-lg font-bold text-text-primary truncate">{entry.tenant.name}</h1>
          </div>

          <p className="text-xs text-text-muted mb-4">
            Resumo agregado, só leitura — pra ver e agir sobre os itens dessa instituição, é preciso
            acessar com um usuário vinculado a ela.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <SummaryCard
              icon={FileSignature}
              label="Contratos ativos"
              value={entry.stats.contratosAtivos.toString()}
            />
            <SummaryCard
              icon={Layers2}
              label="Empenhos ativos"
              value={entry.stats.empenhosAtivos.toString()}
              subtitle={formatCurrency(entry.stats.empenhosAtivosValor)}
            />
            <SummaryCard
              icon={ClipboardList}
              label="Ordens de serviço ativas"
              value={entry.stats.osAtivas.toString()}
            />
            <SummaryCard
              icon={HardHat}
              label="Obras em andamento"
              value={entry.stats.obrasEmAndamento.toString()}
            />
            <SummaryCard
              icon={Wallet}
              label="Orçamento de obras"
              value={formatCurrency(entry.stats.orcamentoTotal)}
            />
            <SummaryCard
              icon={Wallet}
              label="Executado em obras"
              value={formatCurrency(entry.stats.valorExecutadoTotal)}
            />
            <SummaryCard
              icon={Receipt}
              label="Notas fiscais pendentes/vencidas"
              value={entry.stats.notasPendentesVencidasCount.toString()}
              subtitle={formatCurrency(entry.stats.notasPendentesVencidasValor)}
            />
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  subtitle,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center mb-2">
        <Icon size={16} className="text-primary-500" />
      </div>
      <p className="text-xl font-bold text-text-primary leading-none">{value}</p>
      <p className="text-xs text-text-muted mt-1">{label}</p>
      {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
    </div>
  );
}
