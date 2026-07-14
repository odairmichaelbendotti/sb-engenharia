import { Layers2, ChevronRight, Calendar } from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/format-currency";
import type { MockEmpenho } from "./mockData";

type ActiveEmpenhosTableProps = {
  empenhos: MockEmpenho[];
};

export default function ActiveEmpenhosTable({
  empenhos,
}: ActiveEmpenhosTableProps) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <Layers2 size={18} className="text-primary-500" />
            Empenhos Ativos
          </h3>
          <p className="text-text-secondary text-sm">
            Acompanhamento de progresso
          </p>
        </div>
        <button className="text-primary-500 text-sm font-medium hover:underline flex items-center gap-1">
          Ver todos <ChevronRight size={16} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-muted">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Número
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Empresa
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Valor
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Progresso
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Prazo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {empenhos.map((empenho) => (
              <tr
                key={empenho.id}
                className="hover:bg-surface-muted/50 transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Layers2 size={18} className="text-primary-500" />
                    </div>
                    <span className="font-medium text-text-primary text-sm">
                      {empenho.numero}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-text-primary">
                  {empenho.empresa}
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="font-semibold text-text-primary text-sm">
                    {formatCurrency(empenho.valor)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-surface-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${empenho.progresso}%` }}
                      />
                    </div>
                    <span className="text-xs text-text-secondary w-8">
                      {empenho.progresso}%
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1 text-sm text-text-secondary">
                    <Calendar size={14} />
                    {formatDate(empenho.dataLimite)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
