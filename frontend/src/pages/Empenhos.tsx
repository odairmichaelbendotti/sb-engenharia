import { useState, useMemo } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  Search,
  Filter,
  Layers2,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
} from "lucide-react";

interface Empenho {
  id: number;
  numero: string;
  empresaId: number;
  empresaNome: string;
  valor: number;
  data: string;
  dataLimite: string;
  status: "ativo" | "concluido" | "cancelado";
  descricao: string;
}

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

const ITEMS_PER_PAGE = 10;

// Mock empresas para seleção
const empresasMock = [
  { id: 1, nome: "Construtora Silva Ltda", cnpj: "12.345.678/0001-90" },
  { id: 2, nome: "Engenharia Santos S.A.", cnpj: "98.765.432/0001-10" },
  { id: 3, nome: "Obras Rápidas ME", cnpj: "45.678.901/0001-23" },
  { id: 4, nome: "Fundação Forte EPP", cnpj: "67.890.123/0001-45" },
  { id: 5, nome: "Estrutura Primavera", cnpj: "89.012.345/0001-67" },
];

export default function Empenhos() {
  const [empenhos, setEmpenhos] = useState<Empenho[]>([
    {
      id: 1,
      numero: "EMP-2024-001",
      empresaId: 1,
      empresaNome: "Construtora Silva Ltda",
      valor: 150000,
      data: "2024-01-15",
      dataLimite: "2024-12-31",
      status: "ativo",
      descricao: "Construção de ponte sobre o rio Tietê",
    },
    {
      id: 2,
      numero: "EMP-2024-002",
      empresaId: 2,
      empresaNome: "Engenharia Santos S.A.",
      valor: 230000,
      data: "2024-02-10",
      dataLimite: "2024-11-30",
      status: "ativo",
      descricao: "Reforma do sistema de drenagem",
    },
    {
      id: 3,
      numero: "EMP-2024-003",
      empresaId: 1,
      empresaNome: "Construtora Silva Ltda",
      valor: 75000,
      data: "2024-03-20",
      dataLimite: "2024-06-30",
      status: "concluido",
      descricao: "Pavimentação da avenida principal",
    },
    {
      id: 4,
      numero: "EMP-2024-004",
      empresaId: 3,
      empresaNome: "Obras Rápidas ME",
      valor: 89000,
      data: "2024-04-05",
      dataLimite: "2024-10-15",
      status: "ativo",
      descricao: "Construção de ciclovia",
    },
    {
      id: 5,
      numero: "EMP-2024-005",
      empresaId: 4,
      empresaNome: "Fundação Forte EPP",
      valor: 120000,
      data: "2024-05-12",
      dataLimite: "2024-09-30",
      status: "cancelado",
      descricao: "Fundação do novo prédio administrativo",
    },
    {
      id: 6,
      numero: "EMP-2024-006",
      empresaId: 5,
      empresaNome: "Estrutura Primavera",
      valor: 175000,
      data: "2024-06-01",
      dataLimite: "2025-03-31",
      status: "ativo",
      descricao: "Montagem de estrutura metálica",
    },
    {
      id: 7,
      numero: "EMP-2024-007",
      empresaId: 2,
      empresaNome: "Engenharia Santos S.A.",
      valor: 45000,
      data: "2024-07-18",
      dataLimite: "2024-08-30",
      status: "concluido",
      descricao: "Manutenção preventiva equipamentos",
    },
    {
      id: 8,
      numero: "EMP-2024-008",
      empresaId: 3,
      empresaNome: "Obras Rápidas ME",
      valor: 67000,
      data: "2024-08-22",
      dataLimite: "2024-12-15",
      status: "ativo",
      descricao: "Reforma de fachada",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [empenhoToDelete, setEmpenhoToDelete] = useState<Empenho | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
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

  // Métricas
  const metrics = useMemo(() => {
    return {
      total: empenhos.length,
      totalValue: empenhos.reduce((sum, emp) => sum + emp.valor, 0),
      ativo: empenhos.filter((emp) => emp.status === "ativo").length,
      ativoValue: empenhos
        .filter((emp) => emp.status === "ativo")
        .reduce((sum, emp) => sum + emp.valor, 0),
      concluido: empenhos.filter((emp) => emp.status === "concluido").length,
      concluidoValue: empenhos
        .filter((emp) => emp.status === "concluido")
        .reduce((sum, emp) => sum + emp.valor, 0),
      cancelado: empenhos.filter((emp) => emp.status === "cancelado").length,
      canceladoValue: empenhos
        .filter((emp) => emp.status === "cancelado")
        .reduce((sum, emp) => sum + emp.valor, 0),
    };
  }, [empenhos]);

  // Filtros
  const filteredEmpenhos = useMemo(() => {
    return empenhos.filter(
      (empenho) =>
        empenho.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empenho.empresaNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empenho.descricao.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [empenhos, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredEmpenhos.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmpenhos = filteredEmpenhos.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  // Funções de manipulação
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const openModal = (empenho?: Empenho) => {
    if (empenho) {
      setEditingId(empenho.id);
      setFormData({
        numero: empenho.numero,
        empresaId: empenho.empresaId.toString(),
        empresaNome: empenho.empresaNome,
        valor: empenho.valor.toString(),
        data: empenho.data,
        dataLimite: empenho.dataLimite,
        status: empenho.status,
        descricao: empenho.descricao,
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

  const openDeleteModal = (empenho: Empenho) => {
    setEmpenhoToDelete(empenho);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
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
    if (!formData.numero || !formData.empresaId || !formData.valor) return;

    if (editingId) {
      setEmpenhos(
        empenhos.map((emp) =>
          emp.id === editingId
            ? {
                ...emp,
                ...formData,
                empresaId: parseInt(formData.empresaId),
                valor: parseFloat(formData.valor),
              }
            : emp,
        ),
      );
    } else {
      setEmpenhos([
        ...empenhos,
        {
          id: Math.max(...empenhos.map((e) => e.id), 0) + 1,
          numero: formData.numero,
          empresaId: parseInt(formData.empresaId),
          empresaNome: formData.empresaNome,
          valor: parseFloat(formData.valor),
          data: formData.data,
          dataLimite: formData.dataLimite,
          status: formData.status,
          descricao: formData.descricao,
        },
      ]);
    }
    closeModal();
    setCurrentPage(1);
  };

  const handleDelete = () => {
    if (empenhoToDelete) {
      setEmpenhos(empenhos.filter((emp) => emp.id !== empenhoToDelete.id));
      closeDeleteModal();
    }
  };

  const getStatusConfig = (status: Empenho["status"]) => {
    const configs = {
      ativo: {
        bg: "bg-success-bg",
        text: "text-success-text",
        border: "border-success-border",
        icon: CheckCircle2,
        label: "Ativo",
      },
      concluido: {
        bg: "bg-accent-100",
        text: "text-accent-600",
        border: "border-accent-200",
        icon: CheckCircle2,
        label: "Concluído",
      },
      cancelado: {
        bg: "bg-danger-bg",
        text: "text-danger-text",
        border: "border-danger-border",
        icon: XCircle,
        label: "Cancelado",
      },
    };
    return configs[status];
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-secondary mb-4">
        <Home size={16} />
        <span>/</span>
        <span>Administrativo</span>
        <span>/</span>
        <span className="text-text-primary font-medium">Empenhos</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Layers2 className="text-primary-500" />
            Empenhos
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Gerencie os empenhos e acompanhe o vínculo com empresas
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          Novo Empenho
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-xs">Total de Empenhos</p>
              <p className="text-2xl font-bold text-text-primary mt-1">
                {metrics.total}
              </p>
            </div>
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Layers2 size={20} className="text-primary-500" />
            </div>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-xs">Valor Total</p>
              <p className="text-lg font-bold text-text-primary mt-1">
                {formatCurrency(metrics.totalValue)}
              </p>
            </div>
            <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
              <DollarSign size={20} className="text-accent-500" />
            </div>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-xs">Ativos</p>
              <p className="text-2xl font-bold text-success-text mt-1">
                {metrics.ativo}
              </p>
              <p className="text-xs text-success-text/70">
                {formatCurrency(metrics.ativoValue)}
              </p>
            </div>
            <div className="w-10 h-10 bg-success-bg rounded-full flex items-center justify-center">
              <CheckCircle2 size={20} className="text-success-text" />
            </div>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-xs">Concluídos</p>
              <p className="text-2xl font-bold text-accent-600 mt-1">
                {metrics.concluido}
              </p>
              <p className="text-xs text-accent-600/70">
                {formatCurrency(metrics.concluidoValue)}
              </p>
            </div>
            <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
              <Clock size={20} className="text-accent-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Buscar por número, empresa ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-surface-muted transition-colors text-sm text-text-secondary">
          <Filter size={16} />
          Filtros
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-muted border-b border-border">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                  Empenho
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                  Empresa
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden lg:table-cell">
                  Descrição
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden md:table-cell">
                  Prazo
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                  Valor
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedEmpenhos.map((empenho) => {
                const status = getStatusConfig(empenho.status);
                const StatusIcon = status.icon;
                const isNearDeadline =
                  empenho.status === "ativo" &&
                  new Date(empenho.dataLimite) <
                    new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000);
                return (
                  <tr
                    key={empenho.id}
                    className="hover:bg-surface-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                          <Layers2 size={18} className="text-primary-500" />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary text-sm">
                            {empenho.numero}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {formatDate(empenho.data)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-text-muted" />
                        <span className="text-sm text-text-primary">
                          {empenho.empresaNome}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary hidden lg:table-cell">
                      <p className="truncate max-w-[200px]">
                        {empenho.descricao}
                      </p>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="text-sm">
                        <span
                          className={
                            isNearDeadline
                              ? "text-warning-text font-medium"
                              : ""
                          }
                        >
                          {formatDate(empenho.dataLimite)}
                        </span>
                        {isNearDeadline && (
                          <p className="text-xs text-warning-text">
                            Prazo próximo
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <p className="font-semibold text-text-primary text-sm">
                        {formatCurrency(empenho.valor)}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}
                      >
                        <StatusIcon size={12} />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openModal(empenho)}
                          className="p-2 hover:bg-primary-100 text-text-secondary hover:text-primary-500 rounded-md transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(empenho)}
                          className="p-2 hover:bg-danger-bg text-text-secondary hover:text-danger-text rounded-md transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {paginatedEmpenhos.length === 0 && (
          <div className="py-12 text-center">
            <Layers2 size={48} className="mx-auto text-text-muted mb-4" />
            <p className="text-text-secondary font-medium">
              Nenhum empenho encontrado
            </p>
            <p className="text-text-muted text-sm mt-1">
              Tente ajustar os filtros ou cadastre um novo empenho
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-muted">
            <p className="text-sm text-text-secondary">
              Mostrando {startIndex + 1} a{" "}
              {Math.min(startIndex + ITEMS_PER_PAGE, filteredEmpenhos.length)}{" "}
              de {filteredEmpenhos.length} empenhos
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-text-secondary">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal - Cadastrar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <h2 className="text-lg font-semibold text-text-primary">
                {editingId ? "Editar Empenho" : "Novo Empenho"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-surface-muted rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="p-4 overflow-y-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Número do Empenho *
                  </label>
                  <input
                    type="text"
                    name="numero"
                    required
                    value={formData.numero}
                    onChange={handleInputChange}
                    placeholder="EMP-2024-001"
                    className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Valor *
                  </label>
                  <input
                    type="number"
                    name="valor"
                    required
                    value={formData.valor}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Empresa *
                  </label>
                  <select
                    name="empresaId"
                    required
                    value={formData.empresaId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  >
                    <option value="">Selecione uma empresa</option>
                    {empresasMock.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nome} - {empresa.cnpj}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Descrição
                  </label>
                  <textarea
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleInputChange}
                    placeholder="Descrição do empenho e serviços contratados"
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Data do Empenho
                  </label>
                  <input
                    type="date"
                    name="data"
                    value={formData.data}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Data Limite
                  </label>
                  <input
                    type="date"
                    name="dataLimite"
                    value={formData.dataLimite}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="concluido">Concluído</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-text-secondary hover:bg-surface-muted rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
                >
                  {editingId ? "Salvar Alterações" : "Criar Empenho"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Confirmar Exclusão */}
      {isDeleteModalOpen && empenhoToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl w-full max-w-md max-h-[85vh] flex flex-col p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
            <div className="text-center overflow-y-auto">
              <div className="w-12 h-12 bg-danger-bg rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-danger-text" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Confirmar Exclusão
              </h3>
              <p className="text-text-secondary text-sm mb-2">
                Tem certeza que deseja excluir o empenho
              </p>
              <p className="font-medium text-text-primary mb-6">
                &quot;{empenhoToDelete.numero}&quot; -{" "}
                {empenhoToDelete.empresaNome}?
              </p>
              <div className="flex justify-center gap-3 shrink-0">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-text-secondary hover:bg-surface-muted rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-danger-text text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Excluir Empenho
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
