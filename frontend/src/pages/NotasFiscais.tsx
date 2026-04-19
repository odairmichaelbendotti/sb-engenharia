import { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
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
import type { Invoice, InvoiceDashboard } from "../store/invoices";
import { AddModal } from "./NotaFiscal/AddModal";

const ITEMS_PER_PAGE = 10;

// Mock dashboard data aligned with InvoiceDashboard type
const mockDashboard: InvoiceDashboard = {
  totalCount: 5,
  totalValue: 64550.5,
  paidInvoices: 2,
  paidValue: 27550.0,
  expiredCount: 1,
  expiredValue: 22500.0,
  pendingInvoices: 2,
  pendingValue: 14500.5,
  allInvoices: [
    {
      id: "1",
      numero: "NF-2024-001",
      description: "Serviços de consultoria",
      vencimento: "2024-02-15",
      value: 15250.0,
      status: "paid",
      createdAt: "2024-01-15",
      updatedAt: "2024-01-15",
      empenho_id: "EMP-2024-001",
      company_id: "comp-001",
      company: {
        id: "comp-001",
        name: "Construtora Silva Ltda",
        cnpj: "12.345.678/0001-90",
        cep: "01001-000",
        city: "São Paulo",
        state: "SP",
        address: "Rua A, 123",
        phone: "(11) 1234-5678",
        email: "contato@silva.com",
        hasActiveContract: true,
        createdAt: "2023-01-01",
        updatedAt: "2024-01-01",
      },
    },
    {
      id: "2",
      numero: "NF-2024-002",
      description: "Desenvolvimento de software",
      vencimento: "2024-02-18",
      value: 8900.5,
      status: "pending",
      createdAt: "2024-01-18",
      updatedAt: "2024-01-18",
      empenho_id: "EMP-2024-002",
      company_id: "comp-002",
      company: {
        id: "comp-002",
        name: "Engenharia Santos S.A.",
        cnpj: "23.456.789/0001-01",
        cep: "02002-000",
        city: "Rio de Janeiro",
        state: "RJ",
        address: "Av. B, 456",
        phone: "(21) 9876-5432",
        email: "contato@santos.com",
        hasActiveContract: true,
        createdAt: "2023-02-01",
        updatedAt: "2024-01-01",
      },
    },
    {
      id: "3",
      numero: "NF-2024-003",
      description: "Fornecimento de produtos",
      vencimento: "2024-02-20",
      value: 22500.0,
      status: "overdue",
      createdAt: "2024-01-20",
      updatedAt: "2024-01-20",
      empenho_id: "EMP-2024-003",
      company_id: "comp-003",
      company: {
        id: "comp-003",
        name: "Obras Rápidas ME",
        cnpj: "34.567.890/0001-12",
        cep: "03003-000",
        city: "Belo Horizonte",
        state: "MG",
        address: "Rua C, 789",
        phone: "(31) 1111-2222",
        email: "contato@obras.com",
        hasActiveContract: true,
        createdAt: "2023-03-01",
        updatedAt: "2024-01-01",
      },
    },
    {
      id: "4",
      numero: "NF-2024-004",
      description: "Campanha publicitária",
      vencimento: "2024-02-22",
      value: 5600.0,
      status: "pending",
      createdAt: "2024-01-22",
      updatedAt: "2024-01-22",
      empenho_id: "EMP-2024-004",
      company_id: "comp-004",
      company: {
        id: "comp-004",
        name: "Fundação Forte EPP",
        cnpj: "45.678.901/0001-23",
        cep: "04004-000",
        city: "Curitiba",
        state: "PR",
        address: "Av. D, 321",
        phone: "(41) 3333-4444",
        email: "contato@forte.com",
        hasActiveContract: true,
        createdAt: "2023-04-01",
        updatedAt: "2024-01-01",
      },
    },
    {
      id: "5",
      numero: "NF-2024-005",
      description: "Serviços de transporte",
      vencimento: "2024-02-25",
      value: 12300.0,
      status: "paid",
      createdAt: "2024-01-25",
      updatedAt: "2024-01-25",
      empenho_id: "EMP-2024-005",
      company_id: "comp-005",
      company: {
        id: "comp-005",
        name: "Estrutura Primavera",
        cnpj: "56.789.012/0001-34",
        cep: "05005-000",
        city: "Porto Alegre",
        state: "RS",
        address: "Rua E, 654",
        phone: "(51) 5555-6666",
        email: "contato@primavera.com",
        hasActiveContract: true,
        createdAt: "2023-05-01",
        updatedAt: "2024-01-01",
      },
    },
  ],
};

export default function NotasFiscais() {
  const [dashboard, setDashboard] = useState<InvoiceDashboard>(mockDashboard);

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Métricas do InvoiceDashboard
  const metrics = useMemo(() => {
    return {
      total: dashboard.totalCount,
      totalValue: dashboard.totalValue,
      paid: dashboard.paidInvoices,
      paidValue: dashboard.paidValue,
      pending: dashboard.pendingInvoices,
      pendingValue: dashboard.pendingValue,
      overdue: dashboard.expiredCount,
      overdueValue: dashboard.expiredValue,
    };
  }, [dashboard]);

  // Filtros
  const filteredInvoices = useMemo(() => {
    return dashboard.allInvoices.filter(
      (invoice) =>
        invoice.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.description.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [dashboard.allInvoices, searchTerm]);

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

  const recalculateDashboard = (invoices: Invoice[]): InvoiceDashboard => {
    const paid = invoices.filter((inv) => inv.status === "paid");
    const pending = invoices.filter((inv) => inv.status === "pending");
    const expired = invoices.filter((inv) => inv.status === "overdue");

    return {
      totalCount: invoices.length,
      totalValue: invoices.reduce((sum, inv) => sum + inv.value, 0),
      paidInvoices: paid.length,
      paidValue: paid.reduce((sum, inv) => sum + inv.value, 0),
      expiredCount: expired.length,
      expiredValue: expired.reduce((sum, inv) => sum + inv.value, 0),
      pendingInvoices: pending.length,
      pendingValue: pending.reduce((sum, inv) => sum + inv.value, 0),
      allInvoices: invoices,
    };
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleOpenDelete = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setIsDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setIsDeleteOpen(false);
    setInvoiceToDelete(null);
  };

  const handleDelete = () => {
    if (invoiceToDelete) {
      const filteredInvoices = dashboard.allInvoices.filter(
        (inv) => inv.id !== invoiceToDelete.id,
      );
      setDashboard(recalculateDashboard(filteredInvoices));
      handleCloseDelete();
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      {
        bg: string;
        text: string;
        border: string;
        icon: typeof CheckCircle2;
        label: string;
      }
    > = {
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
    return configs[status] || configs.pending;
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
          onClick={() => handleOpen()}
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
                  new Date(invoice.vencimento) < new Date();
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
                            {invoice.numero}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {formatDate(invoice.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-text-primary">
                      {invoice.company?.name || "-"}
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
                          {formatDate(invoice.vencimento)}
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
                        {/* TODO: Implementar edição com EditModal */}
                        {/* <button
                          onClick={() => handleEdit(invoice)}
                          className="p-2 hover:bg-primary-100 text-text-secondary hover:text-primary-500 rounded-md transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button> */}
                        <button
                          onClick={() => handleOpenDelete(invoice)}
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

      {/* Modal - Cadastrar (AddModal com integração de empresas e empenhos) */}
      <AddModal
        isOpen={isOpen}
        onClose={() => {
          handleClose();
          setCurrentPage(1);
        }}
        onSave={() => {
          // Recarregar dados após criação
          console.log("Nota fiscal criada com sucesso");
        }}
      />

      {/* Modal - Confirmar Exclusão */}
      {isDeleteOpen && invoiceToDelete && (
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
                &quot;{invoiceToDelete.numero}&quot; -{" "}
                {invoiceToDelete.company?.name || "Sem cliente"}?
              </p>
              <div className="flex justify-center gap-3 shrink-0">
                <button
                  onClick={handleCloseDelete}
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
