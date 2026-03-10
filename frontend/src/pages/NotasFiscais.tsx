import React, { useState, useMemo } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

export default function NotaFiscal() {
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 1,
      number: "NF-2024-001",
      client: "Empresa ABC Ltda",
      value: 15250.0,
      date: "2024-01-15",
      dueDate: "2024-02-15",
      status: "paid",
      description: "Serviços de consultoria",
    },
    {
      id: 2,
      number: "NF-2024-002",
      client: "Tech Solutions Inc",
      value: 8900.5,
      date: "2024-01-18",
      dueDate: "2024-02-18",
      status: "pending",
      description: "Desenvolvimento de software",
    },
    {
      id: 3,
      number: "NF-2024-003",
      client: "Global Trade Corp",
      value: 22500.0,
      date: "2024-01-20",
      dueDate: "2024-02-20",
      status: "overdue",
      description: "Fornecimento de produtos",
    },
    {
      id: 4,
      number: "NF-2024-004",
      client: "Digital Marketing Pro",
      value: 5600.0,
      date: "2024-01-22",
      dueDate: "2024-02-22",
      status: "pending",
      description: "Campanha publicitária",
    },
    {
      id: 5,
      number: "NF-2024-005",
      client: "Logística Express",
      value: 12300.0,
      date: "2024-01-25",
      dueDate: "2024-02-25",
      status: "paid",
      description: "Serviços de transporte",
    },
    {
      id: 6,
      number: "NF-2024-006",
      client: "Consultoria Financeira",
      value: 18750.0,
      date: "2024-01-28",
      dueDate: "2024-02-28",
      status: "pending",
      description: "Análise financeira anual",
    },
    {
      id: 7,
      number: "NF-2024-007",
      client: "Design Studio",
      value: 7200.0,
      date: "2024-02-01",
      dueDate: "2024-03-01",
      status: "pending",
      description: "Criação de identidade visual",
    },
    {
      id: 8,
      number: "NF-2024-008",
      client: "E-commerce Solutions",
      value: 32100.0,
      date: "2024-02-03",
      dueDate: "2024-03-03",
      status: "overdue",
      description: "Desenvolvimento de plataforma",
    },
    {
      id: 9,
      number: "NF-2024-009",
      client: "Agência de Publicidade",
      value: 9800.0,
      date: "2024-02-05",
      dueDate: "2024-03-05",
      status: "paid",
      description: "Campanha de mídia social",
    },
    {
      id: 10,
      number: "NF-2024-010",
      client: "Startup Tech",
      value: 11500.0,
      date: "2024-02-08",
      dueDate: "2024-03-08",
      status: "pending",
      description: "Consultoria de negócios",
    },
    {
      id: 11,
      number: "NF-2024-011",
      client: "Manufatura Ltda",
      value: 45000.0,
      date: "2024-02-10",
      dueDate: "2024-03-10",
      status: "cancelled",
      description: "Fornecimento de máquinas",
    },
    {
      id: 12,
      number: "NF-2024-012",
      client: "Varejo Premium",
      value: 6500.0,
      date: "2024-02-12",
      dueDate: "2024-03-12",
      status: "paid",
      description: "Produtos diversos",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    number: "",
    client: "",
    value: "",
    date: "",
    dueDate: "",
    status: "pending",
    description: "",
  });

  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Cálculos de métricas
  const metrics = useMemo(() => {
    const statusCounts = {
      paid: invoices.filter((inv) => inv.status === "paid").length,
      pending: invoices.filter((inv) => inv.status === "pending").length,
      overdue: invoices.filter((inv) => inv.status === "overdue").length,
      cancelled: invoices.filter((inv) => inv.status === "cancelled").length,
    };

    return {
      total: invoices.length,
      totalValue: invoices.reduce((sum, inv) => sum + inv.value, 0),
      ...statusCounts,
    };
  }, [invoices]);

  // Paginação
  const totalPages = Math.ceil(invoices.length / ITEMS_PER_PAGE);
  const paginatedInvoices = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return invoices.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [invoices, currentPage]);

  // Funções de manipulação
  const handleOpenModal = (invoice: Invoice | null = null) => {
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
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
    if (!formData.number || !formData.client || !formData.value) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (editingId) {
      setInvoices(
        invoices.map((inv) =>
          inv.id === editingId
            ? {
                ...inv,
                number: formData.number,
                client: formData.client,
                value: parseFloat(formData.value),
                date: formData.date,
                dueDate: formData.dueDate,
                status: formData.status as
                  | "paid"
                  | "pending"
                  | "overdue"
                  | "cancelled",
                description: formData.description,
              }
            : inv,
        ),
      );
    } else {
      setInvoices([
        ...invoices,
        {
          id: Date.now(),
          number: formData.number,
          client: formData.client,
          value: parseFloat(formData.value),
          date: formData.date,
          dueDate: formData.dueDate,
          status: formData.status as
            | "paid"
            | "pending"
            | "overdue"
            | "cancelled",
          description: formData.description,
        },
      ]);
    }
    handleCloseModal();
    setCurrentPage(1);
  };

  const handleDelete = (id: number) => {
    setInvoices(invoices.filter((inv) => inv.id !== id));
    setDeleteConfirm(null);
  };

  // Status badges
  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { bg: string; text: string; label: string; dot: string }
    > = {
      paid: {
        bg: "bg-[color:var(--color-success-bg)]",
        text: "text-[color:var(--color-success-text)]",
        label: "Pago",
        dot: "●",
      },
      pending: {
        bg: "bg-[color:var(--color-warning-bg)]",
        text: "text-[color:var(--color-warning-text)]",
        label: "Pendente",
        dot: "●",
      },
      overdue: {
        bg: "bg-[color:var(--color-danger-bg)]",
        text: "text-[color:var(--color-danger-text)]",
        label: "Vencido",
        dot: "●",
      },
      cancelled: {
        bg: "bg-[color:var(--color-border)]",
        text: "text-[color:var(--color-text-secondary)]",
        label: "Cancelado",
        dot: "●",
      },
    };
    return statusMap[status] || statusMap.pending;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] w-full">
      {/* Header Compacto */}
      <header className="bg-[color:var(--color-surface)] border-b border-[color:var(--color-border)]">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[color:var(--color-text-primary)]">
                Notas Fiscais
              </h1>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-5 py-2 bg-[color:var(--color-primary-500)] text-[color:var(--color-text-inverse)] rounded-lg hover:bg-[color:var(--color-primary-600)] transition-colors font-semibold text-sm"
            >
              <Plus size={18} />
              Nova NF
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tabela - 2 colunas */}
          <div className="lg:col-span-2">
            <div className="bg-[color:var(--color-surface)] rounded-lg border border-[color:var(--color-border)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[color:var(--color-surface-muted)] border-b border-[color:var(--color-border)]">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[color:var(--color-text-primary)]">
                        Número
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[color:var(--color-text-primary)]">
                        Cliente
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-[color:var(--color-text-primary)]">
                        Valor
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-semibold text-[color:var(--color-text-primary)]">
                        Status
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-semibold text-[color:var(--color-text-primary)]">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedInvoices.map((invoice, index) => {
                      const statusBadge = getStatusBadge(invoice.status);
                      return (
                        <tr
                          key={invoice.id}
                          className={`border-b border-[color:var(--color-border)] hover:bg-[color:var(--color-surface-muted)] transition-colors ${
                            index === paginatedInvoices.length - 1
                              ? "border-b-0"
                              : ""
                          }`}
                        >
                          <td className="px-5 py-3 text-sm font-semibold text-[color:var(--color-text-primary)]">
                            {invoice.number}
                          </td>
                          <td className="px-5 py-3 text-sm text-[color:var(--color-text-primary)]">
                            {invoice.client}
                          </td>
                          <td className="px-5 py-3 text-sm font-semibold text-[color:var(--color-primary-600)] text-right">
                            {formatCurrency(invoice.value)}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${statusBadge.bg} ${statusBadge.text}`}
                            >
                              <span className="text-xs">{statusBadge.dot}</span>
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenModal(invoice)}
                                className="p-1.5 text-[color:var(--color-primary-500)] hover:bg-[color:var(--color-primary-50)] rounded transition-colors"
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(invoice.id)}
                                className="p-1.5 text-[color:var(--color-danger-text)] hover:bg-[color:var(--color-danger-bg)] rounded transition-colors"
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

              {invoices.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <p className="text-[color:var(--color-text-muted)]">
                    Nenhuma nota fiscal cadastrada. Clique em "Nova NF" para
                    começar.
                  </p>
                </div>
              )}

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]">
                  <span className="text-xs text-[color:var(--color-text-secondary)]">
                    Página {currentPage} de {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="p-1 text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface)] disabled:opacity-50 rounded transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="p-1 text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface)] disabled:opacity-50 rounded transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resumo Rápido - 1 coluna */}
          <div className="space-y-4">
            {/* Card Resumo */}
            <div className="bg-[color:var(--color-surface)] rounded-lg border border-[color:var(--color-border)] p-5">
              <h3 className="text-sm font-bold text-[color:var(--color-text-primary)] mb-4 uppercase tracking-wide">
                Resumo Rápido
              </h3>
              <div className="space-y-3">
                {/* Pago */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[color:var(--color-success-text)]"></span>
                    <span className="text-sm text-[color:var(--color-text-secondary)]">
                      Pago
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-[color:var(--color-text-primary)]">
                    {metrics.paid}
                  </span>
                </div>

                {/* Pendente */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[color:var(--color-warning-text)]"></span>
                    <span className="text-sm text-[color:var(--color-text-secondary)]">
                      Pendente
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-[color:var(--color-text-primary)]">
                    {metrics.pending}
                  </span>
                </div>

                {/* Vencido */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[color:var(--color-danger-text)]"></span>
                    <span className="text-sm text-[color:var(--color-text-secondary)]">
                      Vencido
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-[color:var(--color-text-primary)]">
                    {metrics.overdue}
                  </span>
                </div>

                {/* Cancelado */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[color:var(--color-text-muted)]"></span>
                    <span className="text-sm text-[color:var(--color-text-secondary)]">
                      Cancelado
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-[color:var(--color-text-primary)]">
                    {metrics.cancelled}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Totais */}
            <div className="bg-[color:var(--color-surface)] rounded-lg border border-[color:var(--color-border)] p-5">
              <h3 className="text-sm font-bold text-[color:var(--color-text-primary)] mb-4 uppercase tracking-wide">
                Totais
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-[color:var(--color-text-secondary)] mb-1">
                    Total de NFs
                  </p>
                  <p className="text-xl font-bold text-[color:var(--color-text-primary)]">
                    {metrics.total}
                  </p>
                </div>
                <div className="pt-3 border-t border-[color:var(--color-border)]">
                  <p className="text-xs text-[color:var(--color-text-secondary)] mb-1">
                    Valor Total
                  </p>
                  <p className="text-lg font-bold text-[color:var(--color-primary-600)]">
                    {formatCurrency(metrics.totalValue)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[color:var(--color-surface)] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[color:var(--color-border)]">
              <h2 className="text-xl font-bold text-[color:var(--color-text-primary)]">
                {editingId ? "Editar Nota Fiscal" : "Nova Nota Fiscal"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-[color:var(--color-surface-muted)] rounded-lg transition-colors"
              >
                <X
                  size={20}
                  className="text-[color:var(--color-text-secondary)]"
                />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Número */}
                <div>
                  <label className="block text-sm font-semibold text-[color:var(--color-text-primary)] mb-2">
                    Número da NF *
                  </label>
                  <input
                    type="text"
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                    placeholder="NF-2024-001"
                    className="w-full px-4 py-2 border border-[color:var(--color-border)] rounded-lg bg-[color:var(--color-surface)] text-[color:var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-500)]"
                  />
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-sm font-semibold text-[color:var(--color-text-primary)] mb-2">
                    Valor *
                  </label>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-4 py-2 border border-[color:var(--color-border)] rounded-lg bg-[color:var(--color-surface)] text-[color:var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-500)]"
                  />
                </div>
              </div>

              {/* Cliente */}
              <div>
                <label className="block text-sm font-semibold text-[color:var(--color-text-primary)] mb-2">
                  Cliente *
                </label>
                <input
                  type="text"
                  name="client"
                  value={formData.client}
                  onChange={handleInputChange}
                  placeholder="Nome da empresa"
                  className="w-full px-4 py-2 border border-[color:var(--color-border)] rounded-lg bg-[color:var(--color-surface)] text-[color:var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-500)]"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-semibold text-[color:var(--color-text-primary)] mb-2">
                  Descrição
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Descrição dos serviços/produtos"
                  rows={3}
                  className="w-full px-4 py-2 border border-[color:var(--color-border)] rounded-lg bg-[color:var(--color-surface)] text-[color:var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-500)] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Data */}
                <div>
                  <label className="block text-sm font-semibold text-[color:var(--color-text-primary)] mb-2">
                    Data de Emissão
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-[color:var(--color-border)] rounded-lg bg-[color:var(--color-surface)] text-[color:var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-500)]"
                  />
                </div>

                {/* Data de Vencimento */}
                <div>
                  <label className="block text-sm font-semibold text-[color:var(--color-text-primary)] mb-2">
                    Data de Vencimento
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-[color:var(--color-border)] rounded-lg bg-[color:var(--color-surface)] text-[color:var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-500)]"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-[color:var(--color-text-primary)] mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-[color:var(--color-border)] rounded-lg bg-[color:var(--color-surface)] text-[color:var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-500)]"
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="overdue">Vencido</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[color:var(--color-border)]">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 border border-[color:var(--color-border)] text-[color:var(--color-text-primary)] rounded-lg hover:bg-[color:var(--color-surface-muted)] transition-colors font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-[color:var(--color-primary-500)] text-[color:var(--color-text-inverse)] rounded-lg hover:bg-[color:var(--color-primary-600)] transition-colors font-semibold"
              >
                {editingId ? "Atualizar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[color:var(--color-surface)] rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[color:var(--color-danger-bg)] rounded-lg flex items-center justify-center">
                  <AlertCircle
                    className="text-[color:var(--color-danger-text)]"
                    size={24}
                  />
                </div>
                <h3 className="text-lg font-bold text-[color:var(--color-text-primary)]">
                  Confirmar exclusão
                </h3>
              </div>
              <p className="text-[color:var(--color-text-secondary)] mb-6">
                Tem certeza que deseja excluir esta nota fiscal? Esta ação não
                pode ser desfeita.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-6 py-2 border border-[color:var(--color-border)] text-[color:var(--color-text-primary)] rounded-lg hover:bg-[color:var(--color-surface-muted)] transition-colors font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-6 py-2 bg-[color:var(--color-danger-text)] text-[color:var(--color-text-inverse)] rounded-lg hover:opacity-90 transition-opacity font-semibold"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
