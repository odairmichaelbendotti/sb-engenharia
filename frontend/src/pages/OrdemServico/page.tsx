import { useState, useMemo, useEffect } from "react";
import { useOrdensServico } from "../../store/ordensServico";
import type { OrdemServico } from "../../../types/ordem-servico";
import {
  OrdemServicoStatusTabs,
  OrdemServicoFilters,
  OrdemServicoList,
  OrdemServicoModal,
  DeleteOrdemServicoModal,
  ViewOrdemServicoModal,
} from "./index";
import type { OrdemServicoTab } from "./OrdemServicoStatusTabs";
import type { OrdemServicoSort } from "./OrdemServicoFilters";
import { buildEmpenhoOptions } from "../../components/filters/empenho-options";
import { FilterSummary } from "../../components/filters/FilterSummary";
import { useEmpenhoFilter } from "../../hooks/useEmpenhoFilter";
import { compareNumero, getOrdemServicoSchedule, SCHEDULE_URGENCY } from "./ordem-servico-schedule";
import { formatCurrency } from "../../utils/format-currency";
import { usePermission } from "../../hooks/usePermission";
import { PageHeader } from "../../components/PageHeader";
import { ClipboardList, DollarSign } from "lucide-react";

function isSemObra(os: OrdemServico) {
  return os.status === "ATIVO" && !os.obra;
}

function matchesTab(os: OrdemServico, tab: OrdemServicoTab) {
  if (tab === "ALL") return true;
  if (tab === "SEM_OBRA") return isSemObra(os);
  return os.status === tab;
}

function sortOrdensServico(list: OrdemServico[], sort: OrdemServicoSort) {
  if (sort === "VALOR") return [...list].sort((a, b) => b.valor - a.valor);
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
  const [isOpen, setIsOpen] = useState(false);
  const [editingOrdemServico, setEditingOrdemServico] = useState<OrdemServico | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [ordemServicoToDelete, setOrdemServicoToDelete] = useState<OrdemServico | null>(null);
  const [viewingOrdemServicoId, setViewingOrdemServicoId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState<OrdemServicoTab>("ALL");
  const [sort, setSort] = useState<OrdemServicoSort>("URGENCY");
  const [empenhoId, setEmpenhoId] = useEmpenhoFilter();
  const [isListLoading, setIsListLoading] = useState(true);
  const { canCreateOrdemServico, isEmpresaRestricted } = usePermission();

  const { fetchOrdensServico, data } = useOrdensServico();

  const ordensServico = useMemo(() => data?.ordensServico || [], [data]);

  useEffect(() => {
    fetchOrdensServico().finally(() => setIsListLoading(false));
  }, [fetchOrdensServico]);

  // Empenhos que possuem OS nesta organização, para o filtro em dropdown
  // Uma OS pode ter vários empenhos: conta em cada um deles
  const empenhoOptions = useMemo(
    () =>
      buildEmpenhoOptions(ordensServico, (os) =>
        os.empenhos.map((v) => ({ id: v.empenho_id, numero: v.numero, companyName: os.empenho.contrato.company.name })),
      ),
    [ordensServico],
  );

  // Empenho selecionado que deixou de ter OS (ex.: após exclusão) volta para "Todos"
  const activeEmpenhoId = empenhoOptions.some((e) => e.id === empenhoId) ? empenhoId : "";

  const searchedOrdensServico = useMemo(() => {
    const byEmpenho = activeEmpenhoId
      ? ordensServico.filter((os) => os.empenhos.some((v) => v.empenho_id === activeEmpenhoId))
      : ordensServico;
    if (!searchTerm) return byEmpenho;
    const s = searchTerm.toLowerCase();
    return byEmpenho.filter(
      (os) =>
        os.numero.toLowerCase().includes(s) ||
        os.empenhos.some((v) => v.numero.toLowerCase().includes(s)) ||
        os.empenho.contrato.identificador.toLowerCase().includes(s) ||
        os.empenho.contrato.company.name.toLowerCase().includes(s) ||
        (os.obra?.nome.toLowerCase().includes(s) ?? false) ||
        (os.obra?.identificacaoPatrimonial.toLowerCase().includes(s) ?? false),
    );
  }, [ordensServico, searchTerm, activeEmpenhoId]);

  // Contagens seguem a busca e o empenho para que o número de cada aba bata com o que ela mostra
  const tabCounts = useMemo(
    () => ({
      ALL: searchedOrdensServico.length,
      ATIVO: searchedOrdensServico.filter((os) => os.status === "ATIVO").length,
      FINALIZADO: searchedOrdensServico.filter((os) => os.status === "FINALIZADO").length,
      CANCELADO: searchedOrdensServico.filter((os) => os.status === "CANCELADO").length,
      // Pendência interna (criar a obra da OS): não aparece para o login da empresa
      SEM_OBRA: isEmpresaRestricted ? 0 : searchedOrdensServico.filter(isSemObra).length,
    }),
    [searchedOrdensServico, isEmpresaRestricted],
  );

  // Se a aba "Sem obra" some (pendências resolvidas), volta para "Todas"
  const activeTab: OrdemServicoTab = tab === "SEM_OBRA" && tabCounts.SEM_OBRA === 0 ? "ALL" : tab;

  const visibleOrdensServico = useMemo(
    () =>
      sortOrdensServico(
        searchedOrdensServico.filter((os) => matchesTab(os, activeTab)),
        sort,
      ),
    [searchedOrdensServico, activeTab, sort],
  );

  // Busca pelo id na lista atual para o modal refletir atualizações feitas com ele aberto
  const viewingOrdemServico = useMemo(
    () => ordensServico.find((os) => os.id === viewingOrdemServicoId) ?? null,
    [ordensServico, viewingOrdemServicoId],
  );

  const handleOpen = (ordemServico?: OrdemServico) => {
    setEditingOrdemServico(ordemServico || null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingOrdemServico(null);
  };

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
        stat={{ icon: DollarSign, label: "Valor total", value: formatCurrency(data?.stats.valorTotal || 0) }}
        canAct={canCreateOrdemServico}
        actionLabel="Nova Ordem de Serviço"
        onAction={() => handleOpen()}
      />

      <div className="bg-surface border border-border rounded-xl">
        <div className="px-4 pt-4 pb-3 border-b border-border space-y-3">
          <OrdemServicoStatusTabs value={activeTab} counts={tabCounts} onChange={setTab} />
          <OrdemServicoFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sort={sort}
            onSortChange={setSort}
            empenhoOptions={empenhoOptions}
            empenhoId={activeEmpenhoId}
            onEmpenhoChange={setEmpenhoId}
          />
          <FilterSummary
            count={visibleOrdensServico.length}
            searchTerm={searchTerm}
            empenhoNumero={empenhoOptions.find((e) => e.id === activeEmpenhoId)?.numero}
            onClear={() => {
              setSearchTerm("");
              setEmpenhoId("");
            }}
          />
        </div>
        {/* key reinicia a paginação quando filtro, busca ou ordenação mudam */}
        <OrdemServicoList
          key={`${activeTab}|${sort}|${searchTerm}|${activeEmpenhoId}`}
          ordensServico={visibleOrdensServico}
          isLoading={isListLoading}
          onView={(os) => setViewingOrdemServicoId(os.id)}
          onEdit={handleOpen}
          onDelete={handleOpenDelete}
          onAdd={() => handleOpen()}
        />
      </div>

      {viewingOrdemServico && (
        <ViewOrdemServicoModal
          ordemServico={viewingOrdemServico}
          handleClose={() => setViewingOrdemServicoId(null)}
        />
      )}

      {isOpen && (
        <OrdemServicoModal key={editingOrdemServico?.id ?? "nova"} ordemServico={editingOrdemServico} handleClose={handleClose} />
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
