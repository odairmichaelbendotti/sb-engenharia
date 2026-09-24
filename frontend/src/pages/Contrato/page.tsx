import { useState, useMemo, useEffect } from "react";
import { useContratos } from "../../store/contratos";
import type { Contrato } from "../../../types/contrato";
import {
  ContratoStats,
  ContratoFilters,
  ContratoTable,
  ContratoModal,
  DeleteContratoModal,
} from "./index";
import { formatCurrency } from "../../utils/format-currency";
import { usePermission } from "../../hooks/usePermission";
import { PageHeader } from "../../components/PageHeader";
import { FileSignature, DollarSign } from "lucide-react";

export default function Contratos() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [contratoToDelete, setContratoToDelete] = useState<Contrato | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isListLoading, setIsListLoading] = useState(true);

  const { fetchContratos, data } = useContratos();

  const contratos = useMemo(() => data?.contratos || [], [data]);

  const filteredContratos = useMemo(() => {
    if (!searchTerm) return contratos;
    const s = searchTerm.toLowerCase();
    return contratos.filter(
      (contrato) =>
        contrato.identificador.toLowerCase().includes(s) ||
        contrato.descricaoCurta.toLowerCase().includes(s) ||
        contrato.company?.name.toLowerCase().includes(s),
    );
  }, [contratos, searchTerm]);

  useEffect(() => {
    fetchContratos().finally(() => setIsListLoading(false));
  }, [fetchContratos]);

  const metrics = useMemo(() => {
    return {
      total: data?.stats.total || 0,
      ativos: data?.stats.ativos || 0,
      finalizados: data?.stats.finalizados || 0,
      cancelados: data?.stats.cancelados || 0,
      valorTotal: data?.stats.valorTotal || 0,
    };
  }, [data]);

  const handleOpen = (contrato?: Contrato) => {
    setEditingContrato(contrato || null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingContrato(null);
  };

  const handleOpenDelete = (contrato: Contrato) => {
    setContratoToDelete(contrato);
    setIsDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setIsDeleteOpen(false);
    setContratoToDelete(null);
  };

  const { canEditAdministrativo } = usePermission();

  return (
    <div className="p-4 md:p-5 max-w-7xl mx-auto">
      <PageHeader
        icon={FileSignature}
        title="Contratos"
        stat={{ icon: DollarSign, label: "Valor total contratado", value: formatCurrency(metrics.valorTotal) }}
        canAct={canEditAdministrativo}
        actionLabel="Novo Contrato"
        onAction={() => handleOpen()}
      />

      <ContratoStats metrics={metrics} formatCurrency={formatCurrency} />

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 pt-3 pb-2 border-b border-border">
          <ContratoFilters searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          {searchTerm && (
            <p className="text-xs text-text-muted mt-2">
              {filteredContratos.length} resultado
              {filteredContratos.length !== 1 ? "s" : ""} para "{searchTerm}"
            </p>
          )}
        </div>
        <ContratoTable
          contratos={filteredContratos}
          isLoading={isListLoading}
          formatCurrency={formatCurrency}
          onEdit={handleOpen}
          onDelete={handleOpenDelete}
          onAdd={() => handleOpen()}
        />
      </div>

      {isOpen && <ContratoModal contrato={editingContrato} handleClose={handleClose} />}

      {isDeleteOpen && contratoToDelete && (
        <DeleteContratoModal
          isOpen={isDeleteOpen}
          contrato={contratoToDelete}
          handleClose={handleCloseDelete}
        />
      )}
    </div>
  );
}
