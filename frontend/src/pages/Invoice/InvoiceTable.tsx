import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Trash2,
  XCircle,
} from "lucide-react";
import type { Invoice } from "../../../types/invoice";
import { formatCurrency, formatDate } from "../../utils/format-currency";

const ITEMS_PER_PAGE = 10;

type InvoiceTableProps = {
  allInvoices: Invoice[];
  setDeleteInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
  setEditInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
};

const InvoiceTable = ({
  allInvoices,
  setDeleteInvoice,
  setEditInvoice,
}: InvoiceTableProps) => {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(allInvoices.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedInvoices = useMemo(
    () => allInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE),
    [allInvoices, startIndex],
  );

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-muted border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                NF
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Cliente
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden md:table-cell">
                Descrição
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden sm:table-cell">
                Vencimento
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
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
              const s = invoice.status?.toLowerCase();
              const isPago = s === "pago";
              const isVencido = s === "vencido";
              const isCancelado = s === "cancelado";
              const cls = isPago
                ? "bg-success-bg text-success-text border-success-border"
                : isVencido
                  ? "bg-danger-bg text-danger-text border-danger-border"
                  : isCancelado
                    ? "bg-surface-muted text-text-muted border-border"
                    : "bg-warning-bg text-warning-text border-warning-border";
              const label = isPago
                ? "Pago"
                : isVencido
                  ? "Vencido"
                  : isCancelado
                    ? "Cancelado"
                    : "Pendente";
              const Icon = isPago
                ? CheckCircle2
                : isVencido
                  ? AlertCircle
                  : isCancelado
                    ? XCircle
                    : Clock;

              return (
                <tr
                  key={invoice.id}
                  className={`hover:bg-surface-muted/50 transition-colors ${
                    isVencido ? "border-l-2 border-l-danger-text" : ""
                  }`}
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
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-text-primary">
                    {invoice.company?.name || invoice.description}
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-text-secondary hidden md:table-cell">
                    {invoice.description}
                  </td>
                  <td className="py-3 px-4 text-center text-sm hidden sm:table-cell">
                    {formatDate(invoice.vencimento)}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-text-primary text-sm">
                    {formatCurrency(invoice.value)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${cls}`}
                    >
                      <Icon size={10} />
                      {label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="p-2 hover:bg-primary-100 cursor-pointer text-text-secondary hover:text-primary-500 rounded-md transition-colors"
                        title="Gerenciar"
                        onClick={() => setEditInvoice(invoice)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="p-2 hover:bg-danger-bg cursor-pointer text-text-secondary hover:text-danger-text rounded-md transition-colors"
                        title="Excluir"
                        onClick={() => setDeleteInvoice(invoice)}
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

      {/* Empty State */}
      {paginatedInvoices.length === 0 && (
        <div className="py-12 text-center">
          <FileText size={48} className="mx-auto text-text-muted mb-4" />
          <p className="text-text-secondary font-medium">
            Nenhuma nota fiscal encontrada
          </p>
          <p className="text-text-muted text-sm mt-1">
            Tente ajustar a busca ou cadastre uma nova nota fiscal
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-muted">
          <p className="text-sm text-text-secondary">
            Mostrando {startIndex + 1} a{" "}
            {Math.min(startIndex + ITEMS_PER_PAGE, allInvoices.length)} de{" "}
            {allInvoices.length} notas
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-text-secondary">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
};

export default InvoiceTable;
