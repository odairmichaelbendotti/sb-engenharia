import { useState, useMemo, useEffect } from "react";
import { useEmpenhos } from "../../store/empenhos";
import type { EmpenhoList } from "../../../types/empenho";
import {
  EmpenhoStats,
  EmpenhoFilters,
  EmpenhoTable,
  EmpenhoModal,
  DeleteEmpenhoModal,
} from "./index";
import EmpenhoHeader from "./EmpenhoHeader";
import { formatCurrency } from "../../utils/format-currency";
import { usePermission } from "../../hooks/usePermission";

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
  const [isListLoading, setIsListLoading] = useState(true);

  const { fetchListEmpenhos, data } = useEmpenhos();

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
    fetchListEmpenhos().finally(() => setIsListLoading(false));
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

  const { canEditAdministrativo } = usePermission();

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <EmpenhoHeader
        totalValue={metrics.totalValue}
        canCreateAndEditContent={canEditAdministrativo}
        onAdd={() => handleOpen()}
      />

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
          isLoading={isListLoading}
          formatCurrency={formatCurrency}
          onEdit={handleOpen}
          onDelete={handleOpenDelete}
          onAdd={() => handleOpen()}
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
