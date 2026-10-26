import { useEffect, useMemo, useState } from "react";
import { FilePen, ListX, Ruler } from "lucide-react";
import { toast } from "sonner";
import type { PainelMedicaoItem } from "../../../types/medicao";
import { useMedicoes } from "../../store/medicoes";
import { formatCurrency } from "../../utils/format-currency";
import { PageHeader } from "../../components/PageHeader";
import { SummaryStrip, type SummaryCell } from "../../components/SummaryStrip";
import { SearchInput } from "../../components/filters/SearchInput";
import { ScopeFilterButton } from "../../components/filters/ScopeFilterButton";
import { FilterSummary } from "../../components/filters/FilterSummary";
import { matchesScope, resolveScope, scopeChips } from "../../components/filters/scope-options";
import { EMPTY_SCOPE, useScopeFilter } from "../../hooks/useScopeFilter";
import { cx } from "../../utils/cx";
import { MedicoesTable } from "./MedicoesTable";
import { normalizeSearch, percent } from "./medicao-progress";
import { matchesPainelTab, PAINEL_TABS, painelScopeRefs, painelTitulo, type PainelTab } from "./painel-display";

function matchesSearch(item: PainelMedicaoItem, termo: string) {
  if (!termo) return true;
  const campos = [
    painelTitulo(item),
    item.numero,
    item.empresa.name,
    item.contrato.identificador,
    item.descricaoEmpenho,
    ...item.empenhos.map((e) => e.numero),
  ];
  return campos.some((campo) => normalizeSearch(campo).includes(termo));
}

/**
 * Medições (Engenharia): cada OS com a obra, o orçamento e o andamento das medições, com atalhos
 * para lançar o orçamento e medir em tela cheia.
 */
export default function Medicoes() {
  const fetchPainel = useMedicoes((s) => s.fetchPainel);
  const [items, setItems] = useState<PainelMedicaoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState<PainelTab>("ATIVAS");
  const [scope, setScope] = useScopeFilter();

  useEffect(() => {
    fetchPainel()
      .then(setItems)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Erro ao carregar as medições"))
      .finally(() => setIsLoading(false));
  }, [fetchPainel]);

  const { options: scopeOptions, active: activeScope } = useMemo(
    () => resolveScope(items, painelScopeRefs, scope),
    [items, scope],
  );
  const scopeKey = `${activeScope.empresa}|${activeScope.contrato}|${activeScope.empenho}`;

  const searched = useMemo(() => {
    const termo = normalizeSearch(searchTerm);
    return items.filter((item) => matchesScope(painelScopeRefs(item), activeScope) && matchesSearch(item, termo));
  }, [items, searchTerm, activeScope]);

  const tabCounts = useMemo(
    () =>
      Object.fromEntries(
        PAINEL_TABS.map((t) => [t.id, searched.filter((item) => matchesPainelTab(item, t.id)).length]),
      ) as Record<PainelTab, number>,
    [searched],
  );

  const visible = useMemo(() => searched.filter((item) => matchesPainelTab(item, tab)), [searched, tab]);

  // Totais das OS ativas que passam pelos filtros e pela busca
  const summaryCells = useMemo<SummaryCell[]>(() => {
    const ativas = searched.filter((item) => item.status === "ATIVO");
    const orcado = ativas.reduce((acc, item) => acc + item.valorOrcado, 0);
    const medido = ativas.reduce((acc, item) => acc + item.valorMedido, 0);
    const rascunho = ativas.reduce((acc, item) => acc + (item.rascunho?.valor ?? 0), 0);
    const toggle = (alvo: PainelTab) => () => setTab(tab === alvo ? "ATIVAS" : alvo);

    return [
      {
        key: "orcado",
        label: "Orçado",
        value: formatCurrency(orcado),
        hint: `${ativas.length - tabCounts.SEM_ORCAMENTO} de ${ativas.length} OS ativas com orçamento`,
      },
      {
        key: "medido",
        label: "Medido",
        value: formatCurrency(medido),
        hint: orcado > 0 ? `${percent(medido / orcado)}% do orçado` : "medições fechadas",
      },
      {
        key: "saldo",
        label: "Saldo a medir",
        value: formatCurrency(Math.max(0, orcado - medido)),
        hint: "nas OS ativas",
        tone: "primary",
      },
      {
        key: "rascunho",
        label: "Rascunhos abertos",
        value: `${tabCounts.RASCUNHO}`,
        hint: tabCounts.RASCUNHO > 0 ? `${formatCurrency(rascunho)} a fechar` : "nenhuma medição pendente",
        tone: tabCounts.RASCUNHO > 0 ? "warning" : "muted",
        icon: tabCounts.RASCUNHO > 0 ? FilePen : undefined,
        onClick: toggle("RASCUNHO"),
        active: tab === "RASCUNHO",
        disabled: tabCounts.RASCUNHO === 0,
      },
      {
        key: "sem-orcamento",
        label: "Sem orçamento",
        value: `${tabCounts.SEM_ORCAMENTO} OS`,
        hint: tabCounts.SEM_ORCAMENTO > 0 ? "lance o orçamento para medir" : "todas orçadas",
        tone: tabCounts.SEM_ORCAMENTO > 0 ? "default" : "muted",
        icon: tabCounts.SEM_ORCAMENTO > 0 ? ListX : undefined,
        onClick: toggle("SEM_ORCAMENTO"),
        active: tab === "SEM_ORCAMENTO",
        disabled: tabCounts.SEM_ORCAMENTO === 0,
      },
    ];
  }, [searched, tabCounts, tab]);

  return (
    <div className="p-4 md:p-5 max-w-7xl mx-auto">
      <PageHeader
        icon={Ruler}
        title="Medições"
        description={`Engenharia · ${tabCounts.ATIVAS} OS ativas${tabCounts.RASCUNHO > 0 ? ` · ${tabCounts.RASCUNHO} com rascunho aberto` : ""}`}
      />

      <div className="bg-surface border border-border rounded-xl">
        <SummaryStrip cells={summaryCells} />
        <div className="px-4 pt-4 pb-3 border-b border-border space-y-3">
          <div role="tablist" aria-label="Filtrar por situação" className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {PAINEL_TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  title={t.title}
                  onClick={() => setTab(t.id)}
                  className={cx(
                    "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary-200",
                    active
                      ? "bg-primary-500 border-primary-500 text-white"
                      : "bg-surface border-border text-text-secondary hover:bg-surface-muted hover:text-text-primary",
                  )}
                >
                  {t.label}
                  <span className={cx("text-[11px] tabular-nums", active ? "text-white/80" : "text-text-muted")}>
                    {tabCounts[t.id]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por obra, OS, empenho, contrato ou empresa..."
            />
            <ScopeFilterButton options={scopeOptions} value={activeScope} onChange={setScope} />
          </div>
          <FilterSummary
            count={visible.length}
            searchTerm={searchTerm}
            chips={scopeChips(activeScope, scopeOptions, setScope)}
            onClear={() => {
              setSearchTerm("");
              setScope(EMPTY_SCOPE);
            }}
          />
        </div>
        {/* key reinicia a paginação quando filtro ou busca mudam */}
        <MedicoesTable key={`${tab}|${searchTerm}|${scopeKey}`} items={visible} isLoading={isLoading} />
      </div>
    </div>
  );
}
