import { useState, useMemo, useEffect } from "react";
import { Plus, Layers2, DollarSign } from "lucide-react";
import { useEmpenhos } from "../store/empenhos";
import type { EmpenhoList } from "../../types/empenho";
import {
  EmpenhoStats,
  EmpenhoFilters,
  EmpenhoTable,
  EmpenhoModal,
  DeleteEmpenhoModal,
} from "./Empenho";
import { useUser } from "../store/user";
import { formatCurrency } from "../utils/format-currency";

export default function Empenhos() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingEmpenho, setEditingEmpenho] = useState<EmpenhoList | null>(
    null,
  );
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [empenhoToDelete, setEmpenhoToDelete] = useState<EmpenhoList | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");

  const { fetchListEmpenhos, data } = useEmpenhos();
  const { user } = useUser();

  const empenhos = useMemo(() => data?.empenhos || [], [data]);

  const filteredEmpenhos = useMemo(() => {
    if (!searchTerm) return empenhos;
    const s = searchTerm.toLowerCase();
    return empenhos.filter(
      (empenho) =>
        empenho.numero.toLowerCase().includes(s) ||
        empenho.description.toLowerCase().includes(s) ||
        empenho.company?.name.toLowerCase().includes(s),
    );
  }, [empenhos, searchTerm]);

  useEffect(() => {
    fetchListEmpenhos();
  }, [fetchListEmpenhos]);

  // Métricas
  const metrics = useMemo(() => {
    return {
      total: data?.totalEmpenhos || 0,
      totalValue: data?.totalEmpenhosAmount || 0,
      ativo: data?.activeEmpenhos || 0,
      ativoValue: data?.activeEmpenhosAmount || 0,
      concluido: data?.completedEmpenhos || 0,
      concluidoValue: data?.completedEmpenhosAmount || 0,
      cancelado:
        (data?.totalEmpenhos || 0) -
        (data?.activeEmpenhos || 0) -
        (data?.completedEmpenhos || 0),
      canceladoValue:
        (data?.totalEmpenhosAmount || 0) -
        (data?.activeEmpenhosAmount || 0) -
        (data?.completedEmpenhosAmount || 0),
    };
  }, [data]);

  const handleOpen = (empenho?: EmpenhoList) => {
    setEditingEmpenho(empenho || null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingEmpenho(null);
  };

  const handleOpenDelete = (empenho: EmpenhoList) => {
    setEmpenhoToDelete(empenho);
    setIsDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setIsDeleteOpen(false);
    setEmpenhoToDelete(null);
  };

  const handleSave = () => {
    handleClose();
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Layers2 size={20} className="text-primary-500" />
            Empenhos
          </h1>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-text-secondary text-xs">
              Gerencie os empenhos e acompanhe o vínculo com empresas
            </p>
            <span className="text-text-muted text-xs">·</span>
            <div className="flex items-center gap-1 text-xs">
              <DollarSign size={12} className="text-accent-500" />
              <span className="text-text-secondary">Valor total empenhado:</span>
              <span className="font-semibold text-text-primary">{formatCurrency(metrics.totalValue)}</span>
            </div>
          </div>
        </div>
        {(user?.role === "MASTER" || user?.role === "EDITOR") && (
          <button
            onClick={() => handleOpen()}
            className="flex cursor-pointer items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors text-sm font-medium shrink-0"
          >
            <Plus size={16} />
            Novo Empenho
          </button>
        )}
      </div>

      <EmpenhoStats metrics={metrics} formatCurrency={formatCurrency} />

      {/* Filters + Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 pt-3 pb-2 border-b border-border">
          <EmpenhoFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
          {searchTerm && (
            <p className="text-xs text-text-muted mt-2">
              {filteredEmpenhos.length} resultado
              {filteredEmpenhos.length !== 1 ? "s" : ""} para "{searchTerm}"
            </p>
          )}
        </div>
        <EmpenhoTable
          empenhos={filteredEmpenhos}
          formatCurrency={formatCurrency}
          onEdit={handleOpen}
          onDelete={handleOpenDelete}
          user={user}
        />
      </div>

      {isOpen && (
        <EmpenhoModal
          isOpen={isOpen}
          empenho={editingEmpenho}
          handleClose={handleClose}
          handleSubmit={handleSave}
        />
      )}

      {isDeleteOpen && empenhoToDelete && (
        <DeleteEmpenhoModal
          isOpen={isDeleteOpen}
          empenho={empenhoToDelete}
          handleClose={handleCloseDelete}
        />
      )}
    </div>
  );
}
