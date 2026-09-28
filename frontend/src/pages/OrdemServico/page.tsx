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
import type { EmpenhoFilterOption, OrdemServicoSort } from "./OrdemServicoFilters";
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
  const [empenhoId, setEmpenhoId] = useState("");
  const [isListLoading, setIsListLoading] = useState(true);

  const { fetchOrdensServico, data } = useOrdensServico();

  const ordensServico = useMemo(() => data?.ordensServico || [], [data]);

  useEffect(() => {
    fetchOrdensServico().finally(() => setIsListLoading(false));
  }, [fetchOrdensServico]);

  // Empenhos que possuem OS nesta organização, para o filtro em dropdown
  const empenhoOptions = useMemo<EmpenhoFilterOption[]>(() => {
    const byId = new Map<string, EmpenhoFilterOption>();
    for (const os of ordensServico) {
      const entry = byId.get(os.empenho.id);
      if (entry) entry.count += 1;
      else
        byId.set(os.empenho.id, {
          id: os.empenho.id,
          numero: os.empenho.numero,
          companyName: os.empenho.contrato.company.name,
          count: 1,
        });
    }
    return [...byId.values()].sort((a, b) => a.numero.localeCompare(b.numero));
  }, [ordensServico]);

  // Empenho selecionado que deixou de ter OS (ex.: após exclusão) volta para "Todos"
  const activeEmpenhoId = empenhoOptions.some((e) => e.id === empenhoId) ? empenhoId : "";

  const searchedOrdensServico = useMemo(() => {
    const byEmpenho = activeEmpenhoId
      ? ordensServico.filter((os) => os.empenho.id === activeEmpenhoId)
      : ordensServico;
    if (!searchTerm) return byEmpenho;
    const s = searchTerm.toLowerCase();
    return byEmpenho.filter(
      (os) =>
        os.numero.toLowerCase().includes(s) ||
        os.empenho.numero.toLowerCase().includes(s) ||
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
      SEM_OBRA: searchedOrdensServico.filter(isSemObra).length,
    }),
    [searchedOrdensServico],
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

  const { canEditAdministrativo } = usePermission();

  return (
    <div className="p-4 md:p-5 max-w-7xl mx-auto">
      <PageHeader
        icon={ClipboardList}
        title="Ordens de Serviço"
        stat={{ icon: DollarSign, label: "Valor total", value: formatCurrency(data?.stats.valorTotal || 0) }}
        canAct={canEditAdministrativo}
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
          {(searchTerm || activeEmpenhoId) && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>
                {visibleOrdensServico.length} resultado{visibleOrdensServico.length !== 1 ? "s" : ""}
                {searchTerm && <> para "{searchTerm}"</>}
                {activeEmpenhoId && (
                  <> no empenho {empenhoOptions.find((e) => e.id === activeEmpenhoId)?.numero}</>
                )}
              </span>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setEmpenhoId("");
                }}
                className="text-primary-500 hover:text-primary-600 font-medium cursor-pointer"
              >
                Limpar filtros
              </button>
            </div>
          )}
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

      {isOpen && <OrdemServicoModal ordemServico={editingOrdemServico} handleClose={handleClose} />}

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
