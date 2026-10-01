import { useState, useMemo, useEffect } from "react";
import { Loader2, FolderOpen, AlertCircle, Plus, HardHat, DollarSign } from "lucide-react";
import { useObras } from "../../store/obras";
import { usePermission } from "../../hooks/usePermission";
import { useEmpenhoFilter } from "../../hooks/useEmpenhoFilter";
import type { Obra } from "../../../types/obra";
import { ObraStats, ObraTable, ObraModal, DeleteObraModal, ObraFilters, ViewObraModal } from "./index";
import type { ObraSummary } from "./index";
import { OBRA_TIPO_LABEL, isObraOverdue } from "./obra-display";
import { PageHeader } from "../../components/PageHeader";
import { buildEmpenhoOptions } from "../../components/filters/empenho-options";
import { FilterSummary } from "../../components/filters/FilterSummary";
import { formatCurrency } from "../../utils/format-currency";

function matchesSearch(obra: Obra, search: string) {
  if (!search) return true;
  return (
    obra.nome.toLowerCase().includes(search) ||
    obra.identificacaoPatrimonial.toLowerCase().includes(search) ||
    obra.responsavelTecnico.toLowerCase().includes(search) ||
    (OBRA_TIPO_LABEL[obra.tipo] ?? obra.tipo).toLowerCase().includes(search) ||
    obra.ordensServico.some(
      (os) => os.numero.toLowerCase().includes(search) || os.empenhos.some((v) => v.numero.toLowerCase().includes(search)),
    )
  );
}

export default function Obras() {
  const { data, fetchObras } = useObras();
  const { canCreateAndEditContent } = usePermission();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [obraToDelete, setObraToDelete] = useState<Obra | null>(null);
  const [viewingObraId, setViewingObraId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [empenhoId, setEmpenhoId] = useEmpenhoFilter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadObras = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await fetchObras();
      } catch {
        setError("Erro ao carregar obras. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    };
    loadObras();
  }, [fetchObras]);

  const obras = useMemo(() => data?.obras ?? [], [data]);

  // Uma obra pode ter OS de vários empenhos: conta em cada um deles
  const empenhoOptions = useMemo(
    () =>
      buildEmpenhoOptions(obras, (obra) =>
        obra.ordensServico.flatMap((os) =>
          os.empenhos.map((v) => ({ id: v.empenho_id, numero: v.numero, companyName: os.contrato.company.name })),
        ),
      ),
    [obras],
  );

  // Empenho sem obra (ex.: escolhido em outra tela) não filtra esta lista
  const activeEmpenhoId = empenhoOptions.some((e) => e.id === empenhoId) ? empenhoId : "";

  // Resumo acompanha o empenho escolhido, para mostrar a situação só daquele empenho
  const obrasDoEmpenho = useMemo(
    () =>
      activeEmpenhoId
        ? obras.filter((o) => o.ordensServico.some((os) => os.empenhos.some((v) => v.empenho_id === activeEmpenhoId)))
        : obras,
    [obras, activeEmpenhoId],
  );

  const summary = useMemo<ObraSummary>(() => {
    const ativas = obrasDoEmpenho.filter((o) => o.status !== "CANCELADA");
    return {
      total: ativas.length,
      orcamento: ativas.reduce((acc, o) => acc + o.valor, 0),
      executado: ativas.reduce((acc, o) => acc + o.valorExecutado, 0),
      atrasadas: ativas.filter(isObraOverdue).length,
    };
  }, [obrasDoEmpenho]);

  // Sem obras atrasadas o filtro do card deixa de valer
  const activeOnlyOverdue = onlyOverdue && summary.atrasadas > 0;

  const filteredObras = useMemo(() => {
    const s = search.toLowerCase();
    return obrasDoEmpenho.filter((o) => matchesSearch(o, s) && (!activeOnlyOverdue || isObraOverdue(o)));
  }, [obrasDoEmpenho, search, activeOnlyOverdue]);

  // Busca pelo id na lista atual para o resumo refletir edições feitas com ele aberto
  const viewingObra = useMemo(() => obras.find((o) => o.id === viewingObraId) ?? null, [obras, viewingObraId]);

  function handleOpenCreate() {
    setEditingObra(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(obra: Obra) {
    setViewingObraId(null);
    setEditingObra(obra);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingObra(null);
  }

  function handleOpenDelete(obra: Obra) {
    setObraToDelete(obra);
    setIsDeleteOpen(true);
  }

  function handleCloseDelete() {
    setIsDeleteOpen(false);
    setObraToDelete(null);
  }

  function clearFilters() {
    setSearch("");
    setOnlyOverdue(false);
    setEmpenhoId("");
  }

  return (
    <div className="p-4 md:p-5 max-w-7xl mx-auto">
      <PageHeader
        icon={HardHat}
        title="Obras"
        stat={{ icon: DollarSign, label: "Orçamento total", value: formatCurrency(data?.stats.orcamentoTotal ?? 0) }}
        canAct={canCreateAndEditContent}
        actionLabel="Nova Obra"
        onAction={handleOpenCreate}
      />

      {isLoading ? (
        <div className="bg-surface border border-border rounded-lg p-8 flex flex-col items-center justify-center">
          <Loader2 size={32} className="text-primary-500 animate-spin mb-3" />
          <p className="text-text-secondary text-sm">Carregando obras...</p>
        </div>
      ) : error ? (
        <div className="bg-surface border border-border rounded-lg p-8 flex flex-col items-center justify-center">
          <AlertCircle size={32} className="text-danger-text mb-3" />
          <p className="text-text-secondary text-sm mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              fetchObras().finally(() => setIsLoading(false));
            }}
            className="cursor-pointer px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors text-sm font-medium"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          <ObraStats
            summary={summary}
            onlyOverdue={activeOnlyOverdue}
            onToggleOverdue={() => setOnlyOverdue(!activeOnlyOverdue)}
          />

          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="px-4 pt-3 pb-3 border-b border-border space-y-2">
              <ObraFilters
                search={search}
                onSearchChange={setSearch}
                empenhoOptions={empenhoOptions}
                empenhoId={activeEmpenhoId}
                onEmpenhoChange={setEmpenhoId}
              />
              <FilterSummary
                count={filteredObras.length}
                searchTerm={search}
                empenhoNumero={empenhoOptions.find((e) => e.id === activeEmpenhoId)?.numero}
                extra={activeOnlyOverdue ? "com prazo vencido" : undefined}
                onClear={clearFilters}
              />
            </div>
            {filteredObras.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center">
                <FolderOpen size={32} className="text-text-muted mb-3" />
                <p className="text-text-secondary text-sm mb-2">
                  {obras.length === 0 ? "Nenhuma obra cadastrada" : "Nenhuma obra encontrada com os filtros aplicados"}
                </p>
                {obras.length === 0 && canCreateAndEditContent && (
                  <button
                    onClick={handleOpenCreate}
                    className="mt-3 cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors text-sm font-medium"
                  >
                    <Plus size={16} />
                    Criar primeira obra
                  </button>
                )}
              </div>
            ) : (
              /* key reinicia a paginação quando os filtros mudam */
              <ObraTable
                key={`${search}|${activeEmpenhoId}|${activeOnlyOverdue}`}
                obras={filteredObras}
                onView={(obra) => setViewingObraId(obra.id)}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
              />
            )}
          </div>
        </>
      )}

      {viewingObra && (
        <ViewObraModal obra={viewingObra} onEdit={handleOpenEdit} handleClose={() => setViewingObraId(null)} />
      )}

      {isModalOpen && <ObraModal obra={editingObra} handleClose={handleCloseModal} />}

      {isDeleteOpen && obraToDelete && <DeleteObraModal obra={obraToDelete} handleClose={handleCloseDelete} />}
    </div>
  );
}
