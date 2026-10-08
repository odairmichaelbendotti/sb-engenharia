import { useState, useMemo, useEffect } from "react";
import { Loader2, FolderOpen, AlertCircle, AlertTriangle, Plus, HardHat } from "lucide-react";
import { useObras } from "../../store/obras";
import { usePermission } from "../../hooks/usePermission";
import { EMPTY_SCOPE, useScopeFilter } from "../../hooks/useScopeFilter";
import type { Obra, ObraOrdemServico } from "../../../types/obra";
import { ObraTable, ObraModal, DeleteObraModal, ObraFilters, ViewObraModal } from "./index";
import { OBRA_TIPO_LABEL, isObraOverdue } from "./obra-display";
import { getBalance } from "../OrdemServico/ordem-servico-balance";
import { PageHeader } from "../../components/PageHeader";
import { SummaryStrip, type SummaryCell } from "../../components/SummaryStrip";
import { matchesScope, resolveScope, scopeChips, type ScopeRef } from "../../components/filters/scope-options";
import { FilterSummary } from "../../components/filters/FilterSummary";
import { formatCurrency } from "../../utils/format-currency";

// Origem de cada OS da obra: empresa e contrato da OS, uma por empenho
function obraOsScopeRefs(os: ObraOrdemServico): ScopeRef[] {
  return os.empenhos.map((v) => ({
    empresa: { id: os.contrato.company.id, name: os.contrato.company.name },
    contrato: { id: os.contrato.id, identificador: os.contrato.identificador },
    empenho: { id: v.empenho_id, numero: v.numero },
  }));
}

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
  const [scope, setScope] = useScopeFilter();
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

  // Opções de empresa/contrato/empenho a partir das OS das obras; valor escolhido em outra tela
  // que não existe aqui é ignorado
  const { options: scopeOptions, active: activeScope } = useMemo(
    () => resolveScope(obras, (obra) => obra.ordensServico.flatMap(obraOsScopeRefs), scope),
    [obras, scope],
  );
  const scopeKey = `${activeScope.empresa}|${activeScope.contrato}|${activeScope.empenho}`;

  // Obras com alguma OS no recorte e que passam pela busca
  const baseObras = useMemo(() => {
    const s = search.toLowerCase();
    return obras.filter(
      (o) => matchesScope(o.ordensServico.flatMap(obraOsScopeRefs), activeScope) && matchesSearch(o, s),
    );
  }, [obras, activeScope, search]);

  const atrasadas = useMemo(
    () => baseObras.filter((o) => o.status !== "CANCELADA" && isObraOverdue(o)).length,
    [baseObras],
  );

  // Sem obras atrasadas o filtro da célula deixa de valer
  const activeOnlyOverdue = onlyOverdue && atrasadas > 0;

  const filteredObras = useMemo(
    () => (activeOnlyOverdue ? baseObras.filter(isObraOverdue) : baseObras),
    [baseObras, activeOnlyOverdue],
  );

  // Totais das OS no recorte: numa obra com OS de outro contrato/empenho, só as do filtro contam
  const summaryCells = useMemo<SummaryCell[]>(() => {
    const ordens = filteredObras
      .filter((o) => o.status !== "CANCELADA")
      .flatMap((o) => o.ordensServico)
      .filter((os) => os.status !== "CANCELADO" && matchesScope(obraOsScopeRefs(os), activeScope));
    const emitido = ordens.reduce((acc, os) => acc + os.valor, 0);
    const liquidado = ordens.reduce((acc, os) => acc + os.valorExecutado, 0);
    const saldo = ordens
      .filter((os) => os.status === "ATIVO")
      .reduce((acc, os) => acc + getBalance(os.valor, os.valorExecutado).saldo, 0);
    const contratos = new Set(ordens.map((os) => os.contrato.id)).size;
    const obrasValidas = filteredObras.filter((o) => o.status !== "CANCELADA").length;
    const percent = emitido > 0 ? Math.round((liquidado / emitido) * 100) : 0;

    return [
      {
        key: "obras",
        label: "Obras",
        value: String(obrasValidas),
        hint: `${contratos} ${contratos === 1 ? "contrato" : "contratos"}`,
      },
      {
        key: "emitido",
        label: "Emitido em OS",
        value: formatCurrency(emitido),
        hint: `${ordens.length} OS`,
      },
      { key: "liquidado", label: "Liquidado", value: formatCurrency(liquidado), hint: `${percent}% do emitido` },
      { key: "saldo", label: "A liquidar", value: formatCurrency(saldo), hint: "nas OS ativas", tone: "primary" },
      {
        key: "atrasadas",
        label: "Prazo vencido",
        value: String(atrasadas),
        hint: atrasadas === 0 ? "nenhuma obra atrasada" : activeOnlyOverdue ? "clique para ver todas" : "clique para filtrar",
        tone: atrasadas > 0 ? "danger" : "muted",
        icon: atrasadas > 0 ? AlertTriangle : undefined,
        onClick: () => setOnlyOverdue(!activeOnlyOverdue),
        active: activeOnlyOverdue,
        disabled: atrasadas === 0,
      },
    ];
  }, [filteredObras, activeScope, atrasadas, activeOnlyOverdue]);

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
    setScope(EMPTY_SCOPE);
  }

  return (
    <div className="p-4 md:p-5 max-w-7xl mx-auto">
      <PageHeader
        icon={HardHat}
        title="Obras"
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
          {/* Sem overflow-hidden: o painel de filtros precisa sair do card */}
          <div className="bg-surface border border-border rounded-lg">
            <SummaryStrip cells={summaryCells} className="rounded-t-lg" />
            <div className="px-4 pt-3 pb-3 border-b border-border space-y-2">
              <ObraFilters
                search={search}
                onSearchChange={setSearch}
                scopeOptions={scopeOptions}
                scope={activeScope}
                onScopeChange={setScope}
              />
              <FilterSummary
                count={filteredObras.length}
                searchTerm={search}
                chips={scopeChips(activeScope, scopeOptions, setScope)}
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
              <div className="rounded-b-lg overflow-hidden">
                {/* key reinicia a paginação quando os filtros mudam */}
                <ObraTable
                  key={`${search}|${scopeKey}|${activeOnlyOverdue}`}
                  obras={filteredObras}
                  onView={(obra) => setViewingObraId(obra.id)}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                />
              </div>
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
