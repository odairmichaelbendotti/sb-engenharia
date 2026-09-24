import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Building2, Wallet, HardHat, Receipt, ArrowDown, ArrowUp } from "lucide-react";
import { StatCard } from "../../components/StatCard";
import { formatCurrency } from "../../utils/format-currency";
import type { TenantSummaryEntry } from "../../../types/tenant";

type SortKey = "name" | "empenhos" | "execucao" | "notas";

const COLUMNS: { key: SortKey | null; label: string; align: "left" | "right" }[] = [
  { key: "name", label: "Organização", align: "left" },
  { key: null, label: "Contratos", align: "right" },
  { key: "empenhos", label: "Empenhos ativos", align: "right" },
  { key: null, label: "OS ativas", align: "right" },
  { key: null, label: "Obras em andamento", align: "right" },
  { key: "execucao", label: "Execução de obras", align: "right" },
  { key: "notas", label: "Notas pendentes/vencidas", align: "right" },
];

function execPercent(e: TenantSummaryEntry) {
  const { orcamentoTotal, valorExecutadoTotal } = e.stats;
  return orcamentoTotal > 0 ? Math.min(100, (valorExecutadoTotal / orcamentoTotal) * 100) : 0;
}

function sortValue(e: TenantSummaryEntry, key: SortKey): number | string {
  switch (key) {
    case "name":
      return e.tenant.name.toLowerCase();
    case "empenhos":
      return e.stats.empenhosAtivosValor;
    case "execucao":
      return execPercent(e);
    case "notas":
      return e.stats.notasPendentesVencidasValor;
  }
}

export default function DashboardPlatform({ entries }: { entries: TenantSummaryEntry[] }) {
  const navigate = useNavigate();
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "name", dir: "asc" });

  const total = useMemo(
    () =>
      entries.reduce(
        (acc, e) => ({
          empenhosAtivos: acc.empenhosAtivos + e.stats.empenhosAtivos,
          empenhosAtivosValor: acc.empenhosAtivosValor + e.stats.empenhosAtivosValor,
          orcamentoTotal: acc.orcamentoTotal + e.stats.orcamentoTotal,
          valorExecutadoTotal: acc.valorExecutadoTotal + e.stats.valorExecutadoTotal,
          obrasEmAndamento: acc.obrasEmAndamento + e.stats.obrasEmAndamento,
          notasCount: acc.notasCount + e.stats.notasPendentesVencidasCount,
          notasValor: acc.notasValor + e.stats.notasPendentesVencidasValor,
        }),
        {
          empenhosAtivos: 0,
          empenhosAtivosValor: 0,
          orcamentoTotal: 0,
          valorExecutadoTotal: 0,
          obrasEmAndamento: 0,
          notasCount: 0,
          notasValor: 0,
        },
      ),
    [entries],
  );

  const sorted = useMemo(() => {
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...entries].sort((a, b) => {
      const va = sortValue(a, sort.key);
      const vb = sortValue(b, sort.key);
      return va < vb ? -factor : va > vb ? factor : 0;
    });
  }, [entries, sort]);

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "name" ? "asc" : "desc" },
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <StatCard
          compact
          title="Organizações"
          value={entries.length.toString()}
          subtitle="Cadastradas na plataforma"
          icon={<Building2 size={16} className="text-primary-500" />}
          color="bg-primary-100"
        />
        <StatCard
          compact
          title="Empenhos ativos"
          value={formatCurrency(total.empenhosAtivosValor)}
          subtitle={`${total.empenhosAtivos} empenhos em todas as organizações`}
          icon={<Wallet size={16} className="text-success-text" />}
          color="bg-success-bg"
        />
        <StatCard
          compact
          title="Execução de obras"
          value={formatCurrency(total.valorExecutadoTotal)}
          subtitle={`de ${formatCurrency(total.orcamentoTotal)} · ${total.obrasEmAndamento} em andamento`}
          icon={<HardHat size={16} className="text-accent-500" />}
          color="bg-accent-100"
        />
        <StatCard
          compact
          title="Notas pendentes/vencidas"
          value={total.notasCount.toString()}
          subtitle={formatCurrency(total.notasValor)}
          icon={<Receipt size={16} className="text-warning-text" />}
          color="bg-warning-bg"
        />
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <Building2 size={18} className="text-primary-500" />
            Organizações
          </h3>
          <p className="text-text-secondary text-sm">Clique em uma linha para ver o detalhe</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted border-b border-border">
              <tr>
                {COLUMNS.map((col) => {
                  const active = col.key !== null && sort.key === col.key;
                  const SortIcon = sort.dir === "asc" ? ArrowUp : ArrowDown;
                  return (
                    <th
                      key={col.label}
                      className={`px-4 py-2.5 font-medium text-text-secondary whitespace-nowrap ${col.align === "right" ? "text-right" : "text-left"}`}
                    >
                      {col.key ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key!)}
                          className={`cursor-pointer inline-flex items-center gap-1 hover:text-text-primary transition-colors ${active ? "text-text-primary" : ""}`}
                        >
                          {col.label}
                          {active && <SortIcon size={12} />}
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((entry) => {
                const pct = execPercent(entry);
                const hasNotas = entry.stats.notasPendentesVencidasCount > 0;
                return (
                  <tr
                    key={entry.tenant.id}
                    onClick={() => navigate(`/organizacoes/${entry.tenant.id}`)}
                    className="cursor-pointer hover:bg-surface-muted transition-colors"
                  >
                    <td className="px-4 py-2.5 font-medium text-text-primary">
                      <Link
                        to={`/organizacoes/${entry.tenant.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-primary-600"
                      >
                        {entry.tenant.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-right text-text-primary">{entry.stats.contratosAtivos}</td>
                    <td className="px-4 py-2.5 text-right">
                      <p className="text-text-primary">{formatCurrency(entry.stats.empenhosAtivosValor)}</p>
                      <p className="text-xs text-text-muted">{entry.stats.empenhosAtivos} ativos</p>
                    </td>
                    <td className="px-4 py-2.5 text-right text-text-primary">{entry.stats.osAtivas}</td>
                    <td className="px-4 py-2.5 text-right text-text-primary">{entry.stats.obrasEmAndamento}</td>
                    <td className="px-4 py-2.5 text-right">
                      <p className="text-text-primary">{formatCurrency(entry.stats.valorExecutadoTotal)}</p>
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                          <div className="h-full bg-accent-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-text-muted w-9 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <p className={hasNotas ? "text-warning-text font-medium" : "text-text-muted"}>
                        {entry.stats.notasPendentesVencidasCount}
                      </p>
                      {hasNotas && (
                        <p className="text-xs text-warning-text">
                          {formatCurrency(entry.stats.notasPendentesVencidasValor)}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {sorted.length === 0 && (
          <p className="p-4 text-center text-sm text-text-secondary">Nenhuma organização cadastrada</p>
        )}
      </div>
    </>
  );
}
