import { FileText } from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/format-currency";
import { getStatusConfig } from "./dashboard-status";
import type { MockNotaFiscal } from "./mockData";

type PendingInvoicesProps = {
  notasFiscais: MockNotaFiscal[];
};

export default function PendingInvoices({
  notasFiscais,
}: PendingInvoicesProps) {
  const pending = notasFiscais.filter((nf) => nf.status !== "paid");

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <FileText size={18} className="text-warning-text" />
          NFs Pendentes
        </h3>
      </div>
      <div className="divide-y divide-border">
        {pending.map((nf) => {
          const status = getStatusConfig(nf.status);
          return (
            <div
              key={nf.id}
              className="p-4 hover:bg-surface-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-text-primary text-sm">
                  {nf.number}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}
                >
                  {status.label}
                </span>
              </div>
              <p className="text-sm text-text-secondary">{nf.client}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-semibold text-text-primary">
                  {formatCurrency(nf.value)}
                </span>
                <span className="text-xs text-text-muted">
                  {formatDate(nf.date)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-3 border-t border-border bg-surface-muted">
        <button className="w-full text-center text-sm text-primary-500 font-medium hover:underline">
          Ver todas as notas
        </button>
      </div>
    </div>
  );
}
