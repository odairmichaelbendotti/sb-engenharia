import { useState } from "react";
import {
  FileText,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { Invoice } from "./types";

interface NotaFiscalTableProps {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
}

const ITEMS_PER_PAGE = 10;

type InvoiceStatus = "paid" | "pending" | "overdue" | "cancelled";

const statusConfig: Record<
  InvoiceStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  paid: {
    label: "Pago",
    icon: CheckCircle2,
    className: "bg-success-bg text-success-text border-success-border",
  },
  pending: {
    label: "Pendente",
    icon: Clock,
    className: "bg-warning-bg text-warning-text border-warning-border",
  },
  overdue: {
    label: "Vencido",
    icon: AlertCircle,
    className: "bg-danger-bg text-danger-text border-danger-border",
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircle,
    className: "bg-surface-muted text-text-muted border-border",
  },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR");
}

export function NotaFiscalTable({
  invoices,
  onEdit,
  onDelete,
}: NotaFiscalTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(invoices.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedInvoices = invoices.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-muted border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                NF
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase cursor-pointer hover:text-text-primary transition-colors">
                <div className="flex items-center gap-1">
                  Cliente
                  <ArrowUp size={12} className="text-text-muted" />
                </div>
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden md:table-cell">
                Descrição
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase cursor-pointer hover:text-text-primary transition-colors">
                <div className="flex items-center gap-1">
                  Vencimento
                  <ArrowUp size={12} className="text-text-muted" />
                </div>
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase cursor-pointer hover:text-text-primary transition-colors">
                <div className="flex items-center gap-1">
                  Valor
                  <ArrowDown size={12} className="text-text-muted" />
                </div>
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-text-secondary uppercase cursor-pointer hover:text-text-primary transition-colors">
                <div className="flex items-center justify-center gap-1">
                  Status
                  <ArrowUp size={12} className="text-text-muted" />
                </div>
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedInvoices.map((invoice) => {
              const status =
                statusConfig[invoice.status as InvoiceStatus] ||
                statusConfig.pending;
              const StatusIcon = status.icon;
              const isOverdue =
                invoice.status === "overdue" ||
                (invoice.status === "pending" &&
                  new Date(invoice.vencimento) < new Date());

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
                  <td className="py-3 px-4">
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
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.className}`}
                    >
                      <StatusIcon size={12} />
                      {status.label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(invoice)}
                        className="p-2 hover:bg-primary-100 text-text-secondary hover:text-primary-500 rounded-md transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(invoice)}
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
          <p className="text-text-muted text-sm mt-1">Cadastre uma nova NF</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-muted">
          <p className="text-sm text-text-secondary">
            Mostrando {startIndex + 1} a{" "}
            {Math.min(startIndex + ITEMS_PER_PAGE, invoices.length)} de{" "}
            {invoices.length} notas fiscais
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
