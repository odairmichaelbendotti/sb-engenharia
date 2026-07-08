import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  HardHat,
  DollarSign,
  Loader2,
  FolderOpen,
  AlertCircle,
} from "lucide-react";
import { useObras } from "../store/obras";
import { useUser } from "../store/user";
import type { Obra } from "../../types/obra";
import {
  ObraStats,
  ObraTable,
  ObraModal,
  DeleteObraModal,
  ObraFilters,
} from "./Obra";
import type { ObraFiltersState } from "./Obra";
import { formatCurrency } from "../utils/format-currency";

export default function Obras() {
  const { data, fetchObras } = useObras();
  const { user } = useUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [obraToDelete, setObraToDelete] = useState<Obra | null>(null);
  const [filters, setFilters] = useState<ObraFiltersState>({
    search: "",
    status: "",
    tipo: "",
  });
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
  const stats = useMemo(
    () =>
      data?.stats ?? {
        total: 0,
        emAndamento: 0,
        concluidas: 0,
        paralisadas: 0,
        canceladas: 0,
        orcamentoTotal: 0,
        valorExecutadoTotal: 0,
      },
    [data],
  );

  const filteredObras = useMemo(() => {
    return obras.filter((o) => {
      const search = filters.search.toLowerCase();
      const matchSearch =
        !search ||
        o.nome.toLowerCase().includes(search) ||
        o.codigo.toLowerCase().includes(search) ||
        o.responsavelTecnico.toLowerCase().includes(search) ||
        o.cidade.toLowerCase().includes(search);
      const matchStatus = !filters.status || o.status === filters.status;
      const matchTipo = !filters.tipo || o.tipo === filters.tipo;
      return matchSearch && matchStatus && matchTipo;
    });
  }, [obras, filters]);

  function handleOpenCreate() {
    setEditingObra(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(obra: Obra) {
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

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <HardHat size={20} className="text-primary-500" />
            Gerenciador de Obras
          </h1>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-text-secondary text-xs">
              Controle e acompanhamento em tempo real
            </p>
            <span className="text-text-muted text-xs">·</span>
            <div className="flex items-center gap-1 text-xs">
              <DollarSign size={12} className="text-accent-500" />
              <span className="text-text-secondary">Orçamento total:</span>
              <span className="font-semibold text-text-primary">
                {formatCurrency(stats.orcamentoTotal)}
              </span>
            </div>
          </div>
        </div>

        {(user?.role === "MASTER" || user?.role === "EDITOR") && (
          <button
            onClick={handleOpenCreate}
            className="flex cursor-pointer items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors text-sm font-medium shrink-0"
          >
            <Plus size={16} />
            Nova Obra
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-surface border border-border rounded-lg p-12 flex flex-col items-center justify-center">
          <Loader2 size={48} className="text-primary-500 animate-spin mb-4" />
          <p className="text-text-secondary text-sm">Carregando obras...</p>
        </div>
      ) : error ? (
        /* Error State */
        <div className="bg-surface border border-border rounded-lg p-12 flex flex-col items-center justify-center">
          <AlertCircle size={48} className="text-danger-text mb-4" />
          <p className="text-text-secondary text-sm mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              fetchObras().finally(() => setIsLoading(false));
            }}
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors text-sm font-medium"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <ObraStats stats={stats} formatCurrency={formatCurrency} />

          {/* Filters + Table agrupados */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="px-4 pt-3 pb-2 border-b border-border">
              <ObraFilters
                filters={filters}
                onChange={setFilters}
                total={obras.length}
                filtered={filteredObras.length}
              />
            </div>
            {filteredObras.length === 0 ? (
              /* Empty State */
              <div className="p-12 flex flex-col items-center justify-center">
                <FolderOpen size={48} className="text-text-muted mb-4" />
                <p className="text-text-secondary text-sm mb-2">
                  {obras.length === 0
                    ? "Nenhuma obra cadastrada"
                    : "Nenhuma obra encontrada com os filtros aplicados"}
                </p>
                {obras.length === 0 &&
                  (user?.role === "MASTER" || user?.role === "EDITOR") && (
                    <button
                      onClick={handleOpenCreate}
                      className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors text-sm font-medium"
                    >
                      <Plus size={16} />
                      Criar primeira obra
                    </button>
                  )}
              </div>
            ) : (
              <ObraTable
                obras={filteredObras}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
                user={user}
              />
            )}
          </div>
        </>
      )}

      {/* Modals */}
      {isModalOpen && (
        <ObraModal obra={editingObra} handleClose={handleCloseModal} />
      )}

      {isDeleteOpen && obraToDelete && (
        <DeleteObraModal obra={obraToDelete} handleClose={handleCloseDelete} />
      )}
    </div>
  );
}
