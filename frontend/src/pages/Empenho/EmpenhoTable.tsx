import {
  Layers2,
  Building2,
  Trash2,
  ArrowUp,
  ArrowDown,
  FileText,
  CheckCircle2,
  CircleDashed,
  Clock,
} from "lucide-react";
import { useState } from "react";
import type { EmpenhoList } from "../../../types/empenho";
import type { User } from "../../../types/user";

interface EmpenhoTableProps {
  empenhos: EmpenhoList[];
  formatCurrency: (value: number) => string;
  onEdit: (empenho: EmpenhoList) => void;
  onDelete: (empenho: EmpenhoList) => void;
  user: User | null;
}

const formatDate = (date: Date | string) => {
  if (typeof date === "string") {
    return new Date(date).toLocaleDateString("pt-BR");
  }
  return date.toLocaleDateString("pt-BR");
};

const ProgressBar = ({
  value,
  totalPaid,
  status,
  formatCurrency,
}: {
  value: number;
  totalPaid: number;
  status: string;
  formatCurrency: (value: number) => string;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const isFinalizado = status.toLowerCase() === "finalizado";
  const paidValue = totalPaid ?? 0;
  const rawPercentage = (paidValue / value) * 100;
  const percentage = isFinalizado
    ? 100
    : Math.min(100, Math.max(paidValue > 0 ? 1 : 0, Math.round(rawPercentage)));

  const isComplete = percentage === 100;
  const isZero = paidValue === 0;

  const getBarColor = () => {
    if (isFinalizado || isComplete) return "bg-emerald-500";
    if (isZero) return "bg-gray-400";
    return "bg-blue-500";
  };

  const getIcon = () => {
    if (isFinalizado || isComplete) {
      return <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />;
    }
    if (isZero) {
      return <CircleDashed size={16} className="text-gray-400 shrink-0" />;
    }
    return <Clock size={16} className="text-blue-500 shrink-0" />;
  };

  const getStatusText = () => {
    if (isFinalizado) return "Finalizado";
    if (isZero) return "Não iniciado";
    const realPercentage = Math.round(rawPercentage);
    return `${realPercentage > 0 ? realPercentage : "< 1"}% pago`;
  };

  return (
    <div
      className="relative w-full min-w-0"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden min-w-0">
          <div
            className={`h-full rounded-full transition-all duration-300 ${getBarColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {getIcon()}
      </div>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap z-10 shadow-lg">
          <div className="font-medium">{getStatusText()}</div>
          <div className="text-gray-300">
            {formatCurrency(paidValue)} / {formatCurrency(value)}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  );
};

export function EmpenhoTable({
  empenhos,
  formatCurrency,
  onEdit,
  onDelete,
  user,
}: EmpenhoTableProps) {
  if (empenhos.length === 0) {
    return (
      <div className="py-12 text-center">
        <Layers2 size={48} className="mx-auto text-text-muted mb-4" />
        <p className="text-text-secondary font-medium">
          Nenhum empenho encontrado
        </p>
        <p className="text-text-muted text-sm mt-1">
          Tente ajustar os filtros ou cadastre um novo empenho
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-surface-muted border-b border-border">
          <tr>
            <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase cursor-pointer hover:text-text-primary transition-colors">
              <div className="flex items-center gap-1">
                Empenho
                <ArrowUp size={12} className="text-text-muted" />
              </div>
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase cursor-pointer hover:text-text-primary transition-colors">
              <div className="flex items-center gap-1">
                Empresa
                <ArrowUp size={12} className="text-text-muted" />
              </div>
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden lg:table-cell">
              Descrição
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden md:table-cell cursor-pointer hover:text-text-primary transition-colors">
              <div className="flex items-center gap-1">
                Prazo
                <ArrowUp size={12} className="text-text-muted" />
              </div>
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-text-secondary uppercase cursor-pointer hover:text-text-primary transition-colors">
              <div className="flex items-center justify-center gap-1">
                Valor
                <ArrowDown size={12} className="text-text-muted" />
              </div>
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-text-secondary uppercase cursor-pointer hover:text-text-primary transition-colors">
              <div className="flex items-center justify-center gap-1">
                Progresso
                <ArrowUp size={12} className="text-text-muted" />
              </div>
            </th>
            {(user?.role === "MASTER" || user?.role === "EDITOR") && (
              <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Ações
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {empenhos.map((empenho) => {
            const isNearDeadline =
              empenho.status.toLowerCase() === "ativo" &&
              new Date(empenho.endAt) <
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
                        {formatDate(empenho.startAt)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-text-muted" />
                    <span className="text-sm text-text-primary">
                      {empenho.company.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-text-secondary hidden lg:table-cell">
                  <p className="truncate max-w-50">{empenho.description}</p>
                </td>
                <td className="py-3 px-4 hidden md:table-cell">
                  <div className="text-sm">
                    <span
                      className={
                        isNearDeadline ? "text-warning-text font-medium" : ""
                      }
                    >
                      {formatDate(empenho.endAt)}
                    </span>
                    {isNearDeadline && (
                      <p className="text-xs text-warning-text">Prazo próximo</p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <p className="font-semibold text-text-primary text-sm">
                    {formatCurrency(empenho.value)}
                  </p>
                </td>
                <td className="py-3 px-4">
                  <ProgressBar
                    value={empenho.value}
                    totalPaid={empenho.totalPaid}
                    status={empenho.status}
                    formatCurrency={formatCurrency}
                  />
                </td>

                {(user?.role === "MASTER" || user?.role === "EDITOR") && (
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(empenho)}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-primary-50 cursor-pointer text-text-secondary hover:text-primary-700 rounded-md transition-colors text-sm font-medium"
                        title="Gerenciar"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(empenho)}
                        className="p-2 hover:bg-danger-bg cursor-pointer text-text-secondary hover:text-danger-text rounded-md transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
