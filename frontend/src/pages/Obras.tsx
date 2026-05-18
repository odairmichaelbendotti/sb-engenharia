import { useState, useMemo, useEffect } from "react";
import { Plus, HardHat, DollarSign } from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
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

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function Obras() {
  const { data, fetchObras } = useObras();
  const { user } = useUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [obraToDelete, setObraToDelete] = useState<Obra | null>(null);
  const [filters, setFilters] = useState<ObraFiltersState>({ search: "", status: "", tipo: "" });

  useEffect(() => {
    fetchObras();
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
      <Breadcrumb current="Obras" />

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <HardHat className="text-primary-500" />
            Gerenciador de Obras
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-text-secondary text-sm">
              Controle e acompanhamento de obras em tempo real
            </p>
            <span className="text-text-muted">|</span>
            <div className="flex items-center gap-1.5 text-sm">
              <DollarSign size={14} className="text-accent-500" />
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
            <Plus size={18} />
            Nova Obra
          </button>
        )}
      </div>

      {/* Stats */}
      <ObraStats stats={stats} formatCurrency={formatCurrency} />

      {/* Filters */}
      <ObraFilters
        filters={filters}
        onChange={setFilters}
        total={obras.length}
        filtered={filteredObras.length}
      />

      {/* Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <ObraTable
          obras={filteredObras}
          formatCurrency={formatCurrency}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          user={user}
        />
      </div>

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
