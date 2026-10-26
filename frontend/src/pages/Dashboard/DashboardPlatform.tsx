import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Building2, ArrowDown, ArrowUp } from "lucide-react";
import { SummaryStrip } from "../../components/SummaryStrip";
import { Table, TableBody, TableHead, Td, Th, Tr } from "../../components/ui";
import { formatCurrency } from "../../utils/format-currency";
import type { TenantSummaryEntry } from "../../../types/tenant";

type SortKey = "name" | "empenhos" | "execucao" | "notas";

// O alinhamento vem da posição da coluna (tabela padrão); só a organização quebra linha
// `width` das colunas de dado; "Organização" fica com a sobra. `hide` some em telas menores
const COLUMNS: { key: SortKey | null; label: string; width?: string; hide?: string }[] = [
  { key: "name", label: "Organização" },
  { key: null, label: "Contratos", width: "w-24", hide: "hidden xl:table-cell" },
  { key: "empenhos", label: "Empenhos ativos", width: "w-36", hide: "hidden md:table-cell" },
  { key: null, label: "OS ativas", width: "w-24", hide: "hidden xl:table-cell" },
  { key: null, label: "Obras em andamento", width: "w-28", hide: "hidden lg:table-cell" },
  { key: "execucao", label: "Execução de obras", width: "w-40", hide: "hidden sm:table-cell" },
  { key: "notas", label: "Notas pendentes/vencidas", width: "w-36" },
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
      <SummaryStrip
        standalone
        cells={[
          {
            key: "organizacoes",
            label: "Organizações",
            value: String(entries.length),
            hint: "cadastradas na plataforma",
          },
          {
            key: "empenhos",
            label: "Empenhos ativos",
            value: formatCurrency(total.empenhosAtivosValor),
            hint: `${total.empenhosAtivos} empenhos`,
          },
          {
            key: "obras",
            label: "Liquidado em obras",
            value: formatCurrency(total.valorExecutadoTotal),
            hint: `de ${formatCurrency(total.orcamentoTotal)} · ${total.obrasEmAndamento} em andamento`,
          },
          {
            key: "notas",
            label: "Notas pendentes/vencidas",
            value: formatCurrency(total.notasValor),
            hint: `${total.notasCount} ${total.notasCount === 1 ? "nota" : "notas"}`,
            tone: total.notasCount > 0 ? "warning" : "default",
          },
        ]}
      />

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Building2 size={16} className="text-text-muted" />
            Organizações
          </h3>
          <p className="text-text-secondary text-xs mt-0.5">Clique em uma linha para ver o detalhe</p>
        </div>

        <Table>
          <TableHead>
            {COLUMNS.map((col) => {
              const active = col.key !== null && sort.key === col.key;
              const SortIcon = sort.dir === "asc" ? ArrowUp : ArrowDown;
              return (
                <Th key={col.label} width={col.width} className={col.hide}>
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
                </Th>
              );
            })}
          </TableHead>
          <TableBody>
            {sorted.map((entry) => {
              const pct = execPercent(entry);
              const hasNotas = entry.stats.notasPendentesVencidasCount > 0;
              return (
                <Tr key={entry.tenant.id} onOpen={() => navigate(`/organizacoes/${entry.tenant.id}`)}>
                  {/* Nome da organização quebra linha: até duas linhas, completo ao passar o mouse */}
                  <Td>
                    <p className="line-clamp-2 font-medium text-text-primary" title={entry.tenant.name}>
                      <Link
                        to={`/organizacoes/${entry.tenant.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline"
                      >
                        {entry.tenant.name}
                      </Link>
                    </p>
                  </Td>
                  <Td className="hidden xl:table-cell">
                    <span className="text-text-primary">{entry.stats.contratosAtivos}</span>
                  </Td>
                  <Td className="hidden md:table-cell">
                    <p className="text-text-primary">{formatCurrency(entry.stats.empenhosAtivosValor)}</p>
                    <p className="text-xs text-text-muted">{entry.stats.empenhosAtivos} ativos</p>
                  </Td>
                  <Td className="hidden xl:table-cell">
                    <span className="text-text-primary">{entry.stats.osAtivas}</span>
                  </Td>
                  <Td className="hidden lg:table-cell">
                    <span className="text-text-primary">{entry.stats.obrasEmAndamento}</span>
                  </Td>
                  <Td className="hidden sm:table-cell">
                    <p className="text-text-primary">{formatCurrency(entry.stats.valorExecutadoTotal)}</p>
                    {/* inline-flex: a barra segue o alinhamento da coluna */}
                    <div className="inline-flex items-center gap-2 mt-1">
                      <div className="w-16 h-1.5 rounded-full bg-progress-track overflow-hidden">
                        <div className="h-full bg-progress" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-text-muted w-9 text-right">{pct.toFixed(0)}%</span>
                    </div>
                  </Td>
                  <Td>
                    <p className={hasNotas ? "text-warning-text font-medium" : "text-text-muted"}>
                      {entry.stats.notasPendentesVencidasCount}
                    </p>
                    {hasNotas && (
                      <p className="text-xs text-warning-text">
                        {formatCurrency(entry.stats.notasPendentesVencidasValor)}
                      </p>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </TableBody>
        </Table>

        {sorted.length === 0 && (
          <p className="p-4 text-center text-sm text-text-secondary">Nenhuma organização cadastrada</p>
        )}
      </div>
    </>
  );
}
