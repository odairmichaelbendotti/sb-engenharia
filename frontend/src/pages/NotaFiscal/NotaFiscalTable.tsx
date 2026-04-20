import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Trash2,
  XCircle,
} from "lucide-react";
import type { Invoice } from "../../store/invoices";

type NotaFiscalTable = {
  allInvoices: Invoice[];
  setDeleteInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
  setEditInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
};

const NotaFiscalTable = ({
  allInvoices,
  setDeleteInvoice,
  setEditInvoice,
}: NotaFiscalTable) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  console.log(allInvoices);

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
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
            {allInvoices.map((invoice) => (
              <tr className="hover:bg-surface-muted/50 transition-colors">
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
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${invoice.status === "pago" || invoice.status === "PAGO" ? "bg-success-bg text-success-text border-success-border" : invoice.status === "vencido" || invoice.status === "VENCIDO" ? "bg-danger-bg text-danger-text border-danger-border" : invoice.status === "cancelado" || invoice.status === "CANCELADO" ? "bg-gray-100 text-gray-600 border-gray-200" : "bg-warning-bg text-warning-text border-warning-border"}`}
                  >
                    {invoice.status === "pago" || invoice.status === "PAGO" ? (
                      <CheckCircle2 size={12} />
                    ) : invoice.status === "vencido" ||
                      invoice.status === "VENCIDO" ? (
                      <AlertCircle size={12} />
                    ) : invoice.status === "cancelado" ||
                      invoice.status === "CANCELADO" ? (
                      <XCircle size={12} />
                    ) : (
                      <Clock size={12} />
                    )}
                    {invoice.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      className="p-2 hover:bg-primary-100 cursor-pointer text-text-secondary hover:text-primary-500 rounded-md transition-colors"
                      title="Gerenciar"
                      onClick={() => setEditInvoice(invoice)}
                    >
                      <FileText size={16} />
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NotaFiscalTable;
