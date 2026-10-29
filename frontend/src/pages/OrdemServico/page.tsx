import { isEmitida, isPlanejada } from "./os-planejada";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router";
import { useOrdensServico } from "../../store/ordensServico";
import type { OrdemServico } from "../../../types/ordem-servico";
import {
  OrdemServicoStatusTabs,
  OrdemServicoFilters,
  OrdemServicoList,
  OrdemServicoModal,
  DeleteOrdemServicoModal,
} from "./index";
import { useEntityViewer } from "../../store/entityViewer";
import { useEntityEditor } from "../../hooks/useEntityEditor";
import type { OrdemServicoTab } from "./OrdemServicoStatusTabs";
import type { OrdemServicoSort } from "./OrdemServicoFilters";
import { matchesScope, resolveScope, scopeChips, type ScopeRef } from "../../components/filters/scope-options";
import { FilterSummary } from "../../components/filters/FilterSummary";
import { EMPTY_SCOPE, useScopeFilter } from "../../hooks/useScopeFilter";
import { compareNumero, getOrdemServicoSchedule, SCHEDULE_URGENCY } from "./ordem-servico-schedule";
import { getOrdemServicoBalance, isQuitada } from "./ordem-servico-balance";
import { SummaryStrip, type SummaryCell } from "../../components/SummaryStrip";
import { formatCurrency } from "../../utils/format-currency";
import { usePermission } from "../../hooks/usePermission";
import { PageHeader } from "../../components/PageHeader";
import { CheckCircle2, ClipboardList } from "lucide-react";

// Uma OS pode ter vários empenhos (do mesmo contrato): uma origem por empenho
function osScopeRefs(os: OrdemServico): ScopeRef[] {
  const { contrato } = os.empenho;
  return os.empenhos.map((v) => ({
    empresa: { id: contrato.company.id, name: contrato.company.name },
    contrato: { id: contrato.id, identificador: contrato.identificador },
    empenho: { id: v.empenho_id, numero: v.numero },
  }));
}

function isSemObra(os: OrdemServico) {
  return os.status === "ATIVO" && !os.obra;
}

function matchesTab(os: OrdemServico, tab: OrdemServicoTab) {
  if (tab === "ALL") return true;
  if (tab === "SEM_OBRA") return isSemObra(os);
  if (tab === "QUITADA") return isQuitada(os);
  if (tab === "PLANEJADA") return isPlanejada(os);
  // "Ativas" são as emitidas: a planejada fica na aba própria
  if (tab === "ATIVO") return os.status === "ATIVO" && isEmitida(os);
  return os.status === tab;
}

function sortOrdensServico(list: OrdemServico[], sort: OrdemServicoSort) {
  if (sort === "SALDO") {
    return [...list].sort(
      (a, b) => getOrdemServicoBalance(b).saldo - getOrdemServicoBalance(a).saldo || compareNumero(a.numero, b.numero),
    );
  }
  if (sort === "NUMERO") return [...list].sort((a, b) => compareNumero(a.numero, b.numero));

  // Urgência: atrasadas e vencendo primeiro; dentro do mesmo grupo, o prazo mais curto
  const withSchedule = list.map((os) => ({ os, schedule: getOrdemServicoSchedule(os) }));
  withSchedule.sort(
    (a, b) =>
      SCHEDULE_URGENCY[a.schedule.kind] - SCHEDULE_URGENCY[b.schedule.kind] ||
      (a.schedule.daysToDeadline ?? Infinity) - (b.schedule.daysToDeadline ?? Infinity) ||
      compareNumero(a.os.numero, b.os.numero),
  );
  return withSchedule.map(({ os }) => os);
}

export default function OrdensServico() {
  const [searchParams, setSearchParams] = useSearchParams();
  // ?nova=<contrato_id> (vindo de "Nova OS neste contrato") abre o cadastro já no contrato
  const novaParam = searchParams.get("nova");
  const [isOpen, setIsOpen] = useState(Boolean(novaParam));
  const [initialContratoId, setInitialContratoId] = useState<string | null>(novaParam);
  const [editingOrdemServico, setEditingOrdemServico] = useState<OrdemServico | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [ordemServicoToDelete, setOrdemServicoToDelete] = useState<OrdemServico | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState<OrdemServicoTab>("ALL");
  const [sort, setSort] = useState<OrdemServicoSort>("URGENCY");
  const [scope, setScope] = useScopeFilter();
  const [isListLoading, setIsListLoading] = useState(true);
  const { canCreateOrdemServico, canEditAdministrativo, isEmpresaRestricted } = usePermission();

  const { fetchOrdensServico, data } = useOrdensServico();
  const openViewer = useEntityViewer((s) => s.open);
  const osParam = searchParams.get("os");

  const ordensServico = useMemo(() => data?.ordensServico || [], [data]);

  useEffect(() => {
    fetchOrdensServico().finally(() => setIsListLoading(false));
  }, [fetchOrdensServico]);

  // ?os=<id> (vindo de uma notificação) abre o modal da OS; o parâmetro sai da URL em seguida
  useEffect(() => {
    if (!osParam) return;
    openViewer({ kind: "ordemServico", id: osParam });
    setSearchParams(
      (params) => {
        params.delete("os");
        return params;
      },
      { replace: true },
    );
  }, [osParam, openViewer, setSearchParams]);

  // Opções de empresa/contrato/empenho em cascata, montadas das próprias OS; valor escolhido
  // em outra tela que não existe aqui (ou deixou de ter OS) é ignorado
  const { options: scopeOptions, active: activeScope } = useMemo(
    () => resolveScope(ordensServico, osScopeRefs, scope),
    [ordensServico, scope],
  );
  const scopeKey = `${activeScope.empresa}|${activeScope.contrato}|${activeScope.empenho}`;

  const searchedOrdensServico = useMemo(() => {
    const scoped = ordensServico.filter((os) => matchesScope(osScopeRefs(os), activeScope));
    if (!searchTerm) return scoped;
    const s = searchTerm.toLowerCase();
    return scoped.filter(
      (os) =>
        os.numero.toLowerCase().includes(s) ||
        os.empenho.description.toLowerCase().includes(s) ||
        os.empenhos.some((v) => v.numero.toLowerCase().includes(s)) ||
        os.empenho.contrato.identificador.toLowerCase().includes(s) ||
        os.empenho.contrato.company.name.toLowerCase().includes(s) ||
        (os.obra?.nome.toLowerCase().includes(s) ?? false) ||
        (os.obra?.identificacaoPatrimonial.toLowerCase().includes(s) ?? false),
    );
  }, [ordensServico, searchTerm, activeScope]);

  // Contagens seguem a busca e o empenho para que o número de cada aba bata com o que ela mostra
  const tabCounts = useMemo(
    () => ({
      ALL: searchedOrdensServico.length,
      PLANEJADA: searchedOrdensServico.filter(isPlanejada).length,
      ATIVO: searchedOrdensServico.filter((os) => matchesTab(os, "ATIVO")).length,
      QUITADA: searchedOrdensServico.filter(isQuitada).length,
      FINALIZADO: searchedOrdensServico.filter((os) => os.status === "FINALIZADO").length,
      CANCELADO: searchedOrdensServico.filter((os) => os.status === "CANCELADO").length,
      // Pendência interna (criar a obra da OS): não aparece para o login da empresa
      SEM_OBRA: isEmpresaRestricted ? 0 : searchedOrdensServico.filter(isSemObra).length,
    }),
    [searchedOrdensServico, isEmpresaRestricted],
  );

  // Se a aba "Sem obra", "Quitadas" ou "Planejadas" some (pendências resolvidas), volta para "Todas"
  const activeTab: OrdemServicoTab =
    (tab === "SEM_OBRA" && tabCounts.SEM_OBRA === 0) ||
    (tab === "QUITADA" && tabCounts.QUITADA === 0) ||
    (tab === "PLANEJADA" && tabCounts.PLANEJADA === 0)
      ? "ALL"
      : tab;

  // Totais das OS que passam pelos filtros e pela busca. O emitido não conta as planejadas, que
  // aparecem à parte no "Planejado"
  const summaryCells = useMemo<SummaryCell[]>(() => {
    const validas = searchedOrdensServico.filter((os) => os.status !== "CANCELADO" && isEmitida(os));
    const planejadas = searchedOrdensServico.filter(isPlanejada);
    const planejado = planejadas.reduce((acc, os) => acc + (os.valorPlanejado ?? 0), 0);
    const ativas = validas.filter((os) => os.status === "ATIVO");
    const emitido = validas.reduce((acc, os) => acc + os.valor, 0);
    const liquidado = validas.reduce((acc, os) => acc + os.valorExecutado, 0);
    const saldo = ativas.reduce((acc, os) => acc + getOrdemServicoBalance(os).saldo, 0);

    // Saldo livre de cada empenho (uma vez por empenho); com empenho filtrado, só ele
    const livres = new Map<string, number>();
    for (const os of searchedOrdensServico) {
      for (const v of os.empenhos) {
        if (activeScope.empenho && v.empenho_id !== activeScope.empenho) continue;
        livres.set(v.empenho_id, Math.max(0, v.empenhoValue - (v.empenhoComprometido ?? 0)));
      }
    }
    const livre = [...livres.values()].reduce((acc, v) => acc + v, 0);
    const percent = emitido > 0 ? Math.round((liquidado / emitido) * 100) : 0;

    return [
      {
        key: "emitido",
        label: "Emitido em OS",
        value: formatCurrency(emitido),
        hint: `${validas.length} OS · ${ativas.length} ${ativas.length === 1 ? "ativa" : "ativas"}`,
      },
      {
        key: "planejado",
        label: "Planejado",
        value: formatCurrency(planejado),
        hint:
          planejadas.length > 0
            ? `${planejadas.length} OS ${planejadas.length === 1 ? "planejada" : "planejadas"} · fora do emitido`
            : "nenhuma OS planejada",
        tone: planejadas.length > 0 ? "default" : "muted",
        onClick: () => setTab(tab === "PLANEJADA" ? "ALL" : "PLANEJADA"),
        active: tab === "PLANEJADA" && planejadas.length > 0,
        disabled: planejadas.length === 0,
      },
      { key: "liquidado", label: "Liquidado", value: formatCurrency(liquidado), hint: `${percent}% do emitido` },
      { key: "saldo", label: "A liquidar", value: formatCurrency(saldo), hint: "nas OS ativas", tone: "primary" },
      {
        key: "livre",
        label: "Livre nos empenhos",
        value: formatCurrency(livre),
        hint: `para novas OS · ${livres.size} ${livres.size === 1 ? "empenho" : "empenhos"}`,
      },
      {
        key: "quitadas",
        label: "Quitadas",
        value: `${tabCounts.QUITADA} OS`,
        hint: tabCounts.QUITADA > 0 ? "prontas para finalizar" : "nenhuma esperando finalização",
        tone: tabCounts.QUITADA > 0 ? "success" : "muted",
        icon: tabCounts.QUITADA > 0 ? CheckCircle2 : undefined,
        onClick: () => setTab(tab === "QUITADA" ? "ALL" : "QUITADA"),
        active: tab === "QUITADA" && tabCounts.QUITADA > 0,
        disabled: tabCounts.QUITADA === 0,
      },
    ];
  }, [searchedOrdensServico, activeScope.empenho, tabCounts.QUITADA, tab]);

  const visibleOrdensServico = useMemo(
    () =>
      sortOrdensServico(
        searchedOrdensServico.filter((os) => matchesTab(os, activeTab)),
        sort,
      ),
    [searchedOrdensServico, activeTab, sort],
  );

  const handleOpen = (ordemServico?: OrdemServico) => {
    setEditingOrdemServico(ordemServico || null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingOrdemServico(null);
    setInitialContratoId(null);
  };

  // "Nova OS neste contrato": o cadastro já abriu com o contrato; o parâmetro sai da URL
  useEffect(() => {
    if (!novaParam) return;
    setSearchParams(
      (params) => {
        params.delete("nova");
        return params;
      },
      { replace: true },
    );
  }, [novaParam, setSearchParams]);

  // "Editar" do modal de visualização da OS enquanto esta página está aberta
  useEntityEditor(
    "ordemServico",
    (id) => {
      const os = ordensServico.find((o) => o.id === id);
      if (os) handleOpen(os);
    },
    canEditAdministrativo,
  );

  const handleOpenDelete = (ordemServico: OrdemServico) => {
    setOrdemServicoToDelete(ordemServico);
    setIsDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setIsDeleteOpen(false);
    setOrdemServicoToDelete(null);
  };

  return (
    <div className="p-4 md:p-5 max-w-7xl mx-auto">
      <PageHeader
        icon={ClipboardList}
        title="Ordens de Serviço"
        description={`${isEmpresaRestricted ? "Acompanhamento" : "Administrativo"} · ${tabCounts.ATIVO} ativas${tabCounts.QUITADA > 0 ? ` · ${tabCounts.QUITADA} prontas para finalizar` : ""}`}
        canAct={canCreateOrdemServico}
        actionLabel="Nova Ordem de Serviço"
        onAction={() => handleOpen()}
      />

      <div className="bg-surface border border-border rounded-xl">
        <SummaryStrip cells={summaryCells} />
        <div className="px-4 pt-4 pb-3 border-b border-border space-y-3">
          <OrdemServicoStatusTabs value={activeTab} counts={tabCounts} onChange={setTab} />
          <OrdemServicoFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sort={sort}
            onSortChange={setSort}
            scopeOptions={scopeOptions}
            scope={activeScope}
            onScopeChange={setScope}
          />
          <FilterSummary
            count={visibleOrdensServico.length}
            searchTerm={searchTerm}
            chips={scopeChips(activeScope, scopeOptions, setScope)}
            onClear={() => {
              setSearchTerm("");
              setScope(EMPTY_SCOPE);
            }}
          />
        </div>
        {/* key reinicia a paginação quando filtro, busca ou ordenação mudam */}
        <OrdemServicoList
          key={`${activeTab}|${sort}|${searchTerm}|${scopeKey}`}
          ordensServico={visibleOrdensServico}
          isLoading={isListLoading}
          onView={(os) => openViewer({ kind: "ordemServico", id: os.id })}
          onEdit={handleOpen}
          onDelete={handleOpenDelete}
          onAdd={() => handleOpen()}
        />
      </div>

      {isOpen && canCreateOrdemServico && (
        <OrdemServicoModal
          key={editingOrdemServico?.id ?? `nova-${initialContratoId ?? ""}`}
          ordemServico={editingOrdemServico}
          initialContratoId={initialContratoId}
          handleClose={handleClose}
        />
      )}

      {isDeleteOpen && ordemServicoToDelete && (
        <DeleteOrdemServicoModal
          isOpen={isDeleteOpen}
          ordemServico={ordemServicoToDelete}
          handleClose={handleCloseDelete}
        />
      )}
    </div>
  );
}
