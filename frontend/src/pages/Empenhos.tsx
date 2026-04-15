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
} from "./Company/Empenho";
import { useUser } from "../store/user";

interface FormData {
  numero: string;
  empresaId: string;
  empresaNome: string;
  valor: string;
  data: string;
  dataLimite: string;
  status: "ativo" | "concluido" | "cancelado";
  descricao: string;
}

const empresasMock = [
  { id: 1, nome: "Construtora Silva Ltda", cnpj: "12.345.678/0001-90" },
  { id: 2, nome: "Engenharia Santos S.A.", cnpj: "98.765.432/0001-10" },
  { id: 3, nome: "Obras Rápidas ME", cnpj: "45.678.901/0001-23" },
  { id: 4, nome: "Fundação Forte EPP", cnpj: "67.890.123/0001-45" },
  { id: 5, nome: "Estrutura Primavera", cnpj: "89.012.345/0001-67" },
];

export default function Empenhos() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [empenhoToDelete, setEmpenhoToDelete] = useState<EmpenhoList | null>(
    null,
  );
  const [formData, setFormData] = useState<FormData>({
    numero: "",
    empresaId: "",
    empresaNome: "",
    valor: "",
    data: "",
    dataLimite: "",
    status: "ativo",
    descricao: "",
  });

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

  const toInputDate = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toISOString().split("T")[0];
  };

  // Handlers
  const openModal = (empenho?: EmpenhoList) => {
    if (empenho) {
      setEditingId(empenho.id);
      setFormData({
        numero: empenho.numero,
        empresaId: empenho.company_id,
        empresaNome: empenho.company.name,
        valor: empenho.value.toString(),
        data: toInputDate(empenho.startAt),
        dataLimite: toInputDate(empenho.endAt),
        status: empenho.status.toLowerCase() as
          | "ativo"
          | "concluido"
          | "cancelado",
        descricao: empenho.description,
      });
    } else {
      setEditingId(null);
      setFormData({
        numero: "",
        empresaId: "",
        empresaNome: "",
        valor: "",
        data: "",
        dataLimite: "",
        status: "ativo",
        descricao: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const openDeleteModal = (empenho: EmpenhoList) => {
    setEmpenhoToDelete(empenho);
  };

  const closeDeleteModal = () => {
    setEmpenhoToDelete(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    if (name === "empresaId") {
      const empresa = empresasMock.find((e) => e.id.toString() === value);
      setFormData((prev) => ({
        ...prev,
        empresaId: value,
        empresaNome: empresa?.nome || "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    console.log("Salvar empenho:", formData, editingId);
    closeModal();
  };

  const handleDelete = () => {
    console.log("Excluir empenho:", empenhoToDelete);
    closeDeleteModal();
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

      <EmpenhoModal
        isOpen={isModalOpen}
        editingId={editingId}
        formData={formData}
        empresasMock={empresasMock}
        onClose={closeModal}
        onSubmit={handleSave}
        onChange={handleInputChange}
      />

      {empenhoToDelete && (
        <EmpenhoDeleteModal
          empenho={empenhoToDelete}
          onClose={closeDeleteModal}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
