import { useState, useMemo, useEffect } from "react";
import { Plus, Layers2, DollarSign } from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import { useEmpenhos } from "../store/empenhos";
import type { EmpenhoList } from "../../types/empenho";
import {
  EmpenhoStats,
  EmpenhoTable,
  EmpenhoModal,
  EmpenhoDeleteModal,
} from "./Empenho";
import { useUser } from "../store/user";

export default function Empenhos() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmpenho, setEditingEmpenho] = useState<EmpenhoList | null>(
    null,
  );
  const [empenhoToDelete, setEmpenhoToDelete] = useState<EmpenhoList | null>(
    null,
  );

  const { fetchListEmpenhos, data } = useEmpenhos();
  const { user } = useUser();

  const empenhos = useMemo(() => data?.empenhos || [], [data]);

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

  // Funções utilitárias
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const openModal = (empenho?: EmpenhoList) => {
    setEditingEmpenho(empenho || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmpenho(null);
  };

  const openDeleteModal = (empenho: EmpenhoList) => setEmpenhoToDelete(empenho);

  const handleSave = () => {
    console.log("Salvar empenho:", editingEmpenho?.id);
    closeModal();
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <Breadcrumb current="Empenhos" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Layers2 className="text-primary-500" />
            Empenhos
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-text-secondary text-sm">
              Gerencie os empenhos e acompanhe o vínculo com empresas
            </p>
            <span className="text-text-muted">|</span>
            <div className="flex items-center gap-1.5 text-sm">
              <DollarSign size={14} className="text-accent-500" />
              <span className="text-text-secondary">
                Valor total empenhado:
              </span>
              <span className="font-semibold text-text-primary">
                {formatCurrency(metrics.totalValue)}
              </span>
            </div>
          </div>
        </div>
        {(user?.role === "MASTER" || user?.role === "EDITOR") && (
          <button
            onClick={() => openModal()}
            className="flex cursor-pointer items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            Novo Empenho
          </button>
        )}
      </div>

      <EmpenhoStats metrics={metrics} formatCurrency={formatCurrency} />

      {/* Table Container */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <EmpenhoTable
          empenhos={empenhos}
          formatCurrency={formatCurrency}
          onEdit={openModal}
          onDelete={openDeleteModal}
          user={user}
        />
      </div>

      {isModalOpen && (
        <EmpenhoModal
          isOpen={isModalOpen}
          empenho={editingEmpenho}
          onClose={closeModal}
          onSubmit={handleSave}
        />
      )}

      {empenhoToDelete && (
        <EmpenhoDeleteModal
          empenho={empenhoToDelete}
          setEmpenhoToDelete={setEmpenhoToDelete}
        />
      )}
    </div>
  );
}
