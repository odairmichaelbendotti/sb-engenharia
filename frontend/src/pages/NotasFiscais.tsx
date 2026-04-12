import { useState, useMemo } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Search,
  Filter,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { StatCard } from "../components/StatCard";
import Breadcrumb from "../components/Breadcrumb";

interface Invoice {
  id: number;
  number: string;
  client: string;
  value: number;
  date: string;
  dueDate: string;
  status: "paid" | "pending" | "overdue" | "cancelled";
  description: string;
}

interface FormData {
  number: string;
  client: string;
  value: string;
  date: string;
  dueDate: string;
  status: "paid" | "pending" | "overdue" | "cancelled";
  description: string;
}

const ITEMS_PER_PAGE = 10;

export default function NotasFiscais() {
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 1,
      number: "NF-2024-001",
      client: "Construtora Silva Ltda",
      value: 15250.0,
      date: "2024-01-15",
      dueDate: "2024-02-15",
      status: "paid",
      description: "Serviços de consultoria",
    },
    {
      id: 2,
      number: "NF-2024-002",
      client: "Engenharia Santos S.A.",
      value: 8900.5,
      date: "2024-01-18",
      dueDate: "2024-02-18",
      status: "pending",
      description: "Desenvolvimento de software",
    },
    {
      id: 3,
      number: "NF-2024-003",
      client: "Obras Rápidas ME",
      value: 22500.0,
      date: "2024-01-20",
      dueDate: "2024-02-20",
      status: "overdue",
      description: "Fornecimento de produtos",
    },
    {
      id: 4,
      number: "NF-2024-004",
      client: "Fundação Forte EPP",
      value: 5600.0,
      date: "2024-01-22",
      dueDate: "2024-02-22",
      status: "pending",
      description: "Campanha publicitária",
    },
    {
      id: 5,
      number: "NF-2024-005",
      client: "Estrutura Primavera",
      value: 12300.0,
      date: "2024-01-25",
      dueDate: "2024-02-25",
      status: "paid",
      description: "Serviços de transporte",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<FormData>({
    number: "",
    client: "",
    value: "",
    date: "",
    dueDate: "",
    status: "pending",
    description: "",
  });

  // Métricas
  const metrics = useMemo(() => {
    return {
      total: invoices.length,
      totalValue: invoices.reduce((sum, inv) => sum + inv.value, 0),
      paid: invoices.filter((inv) => inv.status === "paid").length,
      paidValue: invoices
        .filter((inv) => inv.status === "paid")
        .reduce((sum, inv) => sum + inv.value, 0),
      pending: invoices.filter((inv) => inv.status === "pending").length,
      pendingValue: invoices
        .filter((inv) => inv.status === "pending")
        .reduce((sum, inv) => sum + inv.value, 0),
      overdue: invoices.filter((inv) => inv.status === "overdue").length,
      overdueValue: invoices
        .filter((inv) => inv.status === "overdue")
        .reduce((sum, inv) => sum + inv.value, 0),
    };
  }, [invoices]);

  // Filtros
  const filteredInvoices = useMemo(() => {
    return invoices.filter(
      (invoice) =>
        invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.description.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [invoices, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedInvoices = filteredInvoices.slice(
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

  const openModal = (invoice?: Invoice) => {
    if (invoice) {
      setEditingId(invoice.id);
      setFormData({
        number: invoice.number,
        client: invoice.client,
        value: invoice.value.toString(),
        date: invoice.date,
        dueDate: invoice.dueDate,
        status: invoice.status,
        description: invoice.description,
      });
    } else {
      setEditingId(null);
      setFormData({
        number: "",
        client: "",
        value: "",
        date: "",
        dueDate: "",
        status: "pending",
        description: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const openDeleteModal = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setInvoiceToDelete(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    if (!formData.number || !formData.client || !formData.value) return;

    if (editingId) {
      setInvoices(
        invoices.map((inv) =>
          inv.id === editingId
            ? { ...inv, ...formData, value: parseFloat(formData.value) }
            : inv,
        ),
      );
    } else {
      setInvoices([
        ...invoices,
        {
          id: Math.max(...invoices.map((i) => i.id), 0) + 1,
          ...formData,
          value: parseFloat(formData.value),
        },
      ]);
    }
    closeModal();
    setCurrentPage(1);
  };

  const handleDelete = () => {
    if (invoiceToDelete) {
      setInvoices(invoices.filter((inv) => inv.id !== invoiceToDelete.id));
      closeDeleteModal();
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getStatusConfig = (status: Invoice["status"]) => {
    const configs = {
      paid: {
        bg: "bg-success-bg",
        text: "text-success-text",
        border: "border-success-border",
        icon: CheckCircle2,
        label: "Pago",
      },
      pending: {
        bg: "bg-warning-bg",
        text: "text-warning-text",
        border: "border-warning-border",
        icon: Clock,
        label: "Pendente",
      },
      overdue: {
        bg: "bg-danger-bg",
        text: "text-danger-text",
        border: "border-danger-border",
        icon: AlertCircle,
        label: "Vencido",
      },
      cancelled: {
        bg: "bg-surface-muted",
        text: "text-text-muted",
        border: "border-border",
        icon: XCircle,
        label: "Cancelado",
      },
    };
    return configs[status];
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <Breadcrumb current="Notas Fiscais" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FileText className="text-primary-500" />
            Notas Fiscais
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Gerencie as notas fiscais emitidas e acompanhe os pagamentos
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          Nova NF
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total de NFs"
          value={metrics.total.toString()}
          subtitle="Emitidas"
          icon={<FileText size={24} className="text-primary-500" />}
          color="bg-primary-100"
        />
        <StatCard
          title="Valor Total"
          value={formatCurrency(metrics.totalValue)}
          subtitle="Soma de todas"
          icon={<DollarSign size={24} className="text-accent-500" />}
          color="bg-accent-100"
        />
        <StatCard
          title="Pagas"
          value={metrics.paid.toString()}
          subtitle={formatCurrency(metrics.paidValue)}
          icon={<CheckCircle2 size={24} className="text-success-text" />}
          color="bg-success-bg"
        />
        <StatCard
          title="Pendentes/Vencidas"
          value={(metrics.pending + metrics.overdue).toString()}
          subtitle={formatCurrency(metrics.pendingValue + metrics.overdueValue)}
          icon={<Clock size={24} className="text-warning-text" />}
          color="bg-warning-bg"
        />
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
            placeholder="Buscar por número, cliente ou descrição..."
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
                  NF
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                  Cliente
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden md:table-cell">
                  Descrição
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden sm:table-cell">
                  Vencimento
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
              {paginatedInvoices.map((invoice) => {
                const status = getStatusConfig(invoice.status);
                const StatusIcon = status.icon;
                const isOverdue =
                  invoice.status !== "paid" &&
                  invoice.status !== "cancelled" &&
                  new Date(invoice.dueDate) < new Date();
                return (
                  <tr
                    key={invoice.id}
                    className="hover:bg-surface-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                          <FileText size={18} className="text-primary-500" />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary text-sm">
                            {invoice.number}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {formatDate(invoice.date)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-text-primary">
                      {invoice.client}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary hidden md:table-cell">
                      <p className="truncate max-w-50">{invoice.description}</p>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <div className="text-sm">
                        <span
                          className={
                            isOverdue ? "text-danger-text font-medium" : ""
                          }
                        >
                          {formatDate(invoice.dueDate)}
                        </span>
                        {isOverdue && (
                          <p className="text-xs text-danger-text">Vencida</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <p className="font-semibold text-text-primary text-sm">
                        {formatCurrency(invoice.value)}
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
                          onClick={() => openModal(invoice)}
                          className="p-2 hover:bg-primary-100 text-text-secondary hover:text-primary-500 rounded-md transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(invoice)}
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

        {paginatedInvoices.length === 0 && (
          <div className="py-12 text-center">
            <FileText size={48} className="mx-auto text-text-muted mb-4" />
            <p className="text-text-secondary font-medium">
              Nenhuma nota fiscal encontrada
            </p>
            <p className="text-text-muted text-sm mt-1">
              Tente ajustar os filtros ou cadastre uma nova NF
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-muted">
            <p className="text-sm text-text-secondary">
              Mostrando {startIndex + 1} a{" "}
              {Math.min(startIndex + ITEMS_PER_PAGE, filteredInvoices.length)}{" "}
              de {filteredInvoices.length} notas fiscais
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
                {editingId ? "Editar Nota Fiscal" : "Nova Nota Fiscal"}
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
                    Número da NF *
                  </label>
                  <input
                    type="text"
                    name="number"
                    required
                    value={formData.number}
                    onChange={handleInputChange}
                    placeholder="NF-2024-001"
                    className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Valor *
                  </label>
                  <input
                    type="number"
                    name="value"
                    required
                    value={formData.value}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Cliente *
                  </label>
                  <input
                    type="text"
                    name="client"
                    required
                    value={formData.client}
                    onChange={handleInputChange}
                    placeholder="Nome da empresa"
                    className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Descrição
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Descrição dos serviços/produtos"
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Data de Emissão
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Data de Vencimento
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
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
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                    <option value="overdue">Vencido</option>
                    <option value="cancelled">Cancelado</option>
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
                  {editingId ? "Salvar Alterações" : "Criar NF"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Confirmar Exclusão */}
      {isDeleteModalOpen && invoiceToDelete && (
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
                Tem certeza que deseja excluir a nota fiscal
              </p>
              <p className="font-medium text-text-primary mb-6">
                &quot;{invoiceToDelete.number}&quot; - {invoiceToDelete.client}?
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
                  Excluir NF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
