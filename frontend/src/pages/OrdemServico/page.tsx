import { useState, useMemo, useEffect } from "react";
import { useOrdensServico } from "../../store/ordensServico";
import type { OrdemServico } from "../../../types/ordem-servico";
import {
  OrdemServicoStats,
  OrdemServicoFilters,
  OrdemServicoTable,
  OrdemServicoModal,
  DeleteOrdemServicoModal,
} from "./index";
import { formatCurrency } from "../../utils/format-currency";
import { usePermission } from "../../hooks/usePermission";
import { PageHeader } from "../../components/PageHeader";
import { ClipboardList, DollarSign, AlertTriangle } from "lucide-react";

export default function OrdensServico() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingOrdemServico, setEditingOrdemServico] = useState<OrdemServico | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [ordemServicoToDelete, setOrdemServicoToDelete] = useState<OrdemServico | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isListLoading, setIsListLoading] = useState(true);

  const { fetchOrdensServico, data } = useOrdensServico();

  const ordensServico = useMemo(() => data?.ordensServico || [], [data]);

  const filteredOrdensServico = useMemo(() => {
    if (!searchTerm) return ordensServico;
    const s = searchTerm.toLowerCase();
    return ordensServico.filter(
      (os) =>
        os.numero.toLowerCase().includes(s) ||
        os.empenho.numero.toLowerCase().includes(s) ||
        os.empenho.contrato.identificador.toLowerCase().includes(s),
    );
  }, [ordensServico, searchTerm]);

  useEffect(() => {
    fetchOrdensServico().finally(() => setIsListLoading(false));
  }, [fetchOrdensServico]);

  const metrics = useMemo(() => {
    return {
      total: data?.stats.total || 0,
      ativas: data?.stats.ativas || 0,
      finalizadas: data?.stats.finalizadas || 0,
      canceladas: data?.stats.canceladas || 0,
      valorTotal: data?.stats.valorTotal || 0,
    };
  }, [data]);

  const ordensServicoSemObra = useMemo(
    () => ordensServico.filter((os) => os.status === "ATIVO" && !os.obra),
    [ordensServico],
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
        stat={{ icon: DollarSign, label: "Valor total", value: formatCurrency(metrics.valorTotal) }}
        canAct={canEditAdministrativo}
        actionLabel="Nova Ordem de Serviço"
        onAction={() => handleOpen()}
      />

      <OrdemServicoStats metrics={metrics} formatCurrency={formatCurrency} />

      {ordensServicoSemObra.length > 0 && (
        <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-warning-border bg-warning-bg px-4 py-3">
          <AlertTriangle size={16} className="text-warning-text shrink-0 mt-0.5" />
          <p className="text-sm text-warning-text">
            <span className="font-semibold">
              {ordensServicoSemObra.length} ordem{ordensServicoSemObra.length !== 1 ? "ns" : ""} de serviço ativa
              {ordensServicoSemObra.length !== 1 ? "s" : ""} sem obra vinculada
            </span>{" "}
            — crie uma obra em Engenharia &gt; Obras e selecione a ordem de serviço correspondente para completar o vínculo.
          </p>
        </div>
      )}

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 pt-3 pb-2 border-b border-border">
          <OrdemServicoFilters searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          {searchTerm && (
            <p className="text-xs text-text-muted mt-2">
              {filteredOrdensServico.length} resultado
              {filteredOrdensServico.length !== 1 ? "s" : ""} para "{searchTerm}"
            </p>
          )}
        </div>
        <OrdemServicoTable
          ordensServico={filteredOrdensServico}
          isLoading={isListLoading}
          formatCurrency={formatCurrency}
          onEdit={handleOpen}
          onDelete={handleOpenDelete}
          onAdd={() => handleOpen()}
        />
      </div>

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
