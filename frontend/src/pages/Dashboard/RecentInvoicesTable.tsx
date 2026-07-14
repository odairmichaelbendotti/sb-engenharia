import { FileText, ChevronRight, CheckCircle2, Clock, AlertCircle, Calendar } from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/format-currency";
import { getStatusConfig } from "./dashboard-status";
import type { MockNotaFiscal } from "./mockData";

type RecentInvoicesTableProps = {
  notasFiscais: MockNotaFiscal[];
};

export default function RecentInvoicesTable({
  notasFiscais,
}: RecentInvoicesTableProps) {
  const recentInvoices = [
    ...notasFiscais,
    {
      id: 5,
      number: "NF-2024-005",
      client: "Estrutura Primavera",
      value: 12300,
      status: "paid",
      date: "2024-01-25",
    },
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <FileText size={18} className="text-accent-500" />
            Últimas Notas Fiscais
          </h3>
          <p className="text-text-secondary text-sm">
            Movimentação financeira recente
          </p>
        </div>
        <button className="text-primary-500 text-sm font-medium hover:underline flex items-center gap-1">
          Ver todas <ChevronRight size={16} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-muted">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                NF
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Cliente
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Valor
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Status
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Data
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {recentInvoices.map((nf) => {
              const status = getStatusConfig(nf.status);
              return (
                <tr
                  key={nf.id}
                  className="hover:bg-surface-muted/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                        <FileText size={18} className="text-accent-500" />
                      </div>
                      <span className="font-medium text-text-primary text-sm">
                        {nf.number}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-text-primary">
                    {nf.client}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-semibold text-text-primary text-sm">
                      {formatCurrency(nf.value)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}
                    >
                      {nf.status === "paid" ? (
                        <CheckCircle2 size={12} />
                      ) : nf.status === "pending" ? (
                        <Clock size={12} />
                      ) : (
                        <AlertCircle size={12} />
                      )}
                      {status.label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-sm text-text-secondary">
                      <Calendar size={14} />
                      {formatDate(nf.date)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
