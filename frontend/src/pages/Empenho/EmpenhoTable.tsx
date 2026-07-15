import {
  Layers2,
  Building2,
  Trash2,
  Eye,
  CheckCircle2,
  CircleDashed,
  Clock,
  Loader2,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { EmpenhoList } from "../../../types/empenho";
import { formatDate } from "../../utils/format-currency";
import { usePermission } from "../../hooks/usePermission";
import { EmpenhoPagination } from "./EmpenhoPagination";

const ITEMS_PER_PAGE = 10;

interface EmpenhoTableProps {
  empenhos: EmpenhoList[];
  isLoading?: boolean;
  formatCurrency: (value: number) => string;
  onEdit: (empenho: EmpenhoList) => void;
  onDelete: (empenho: EmpenhoList) => void;
  onAdd?: () => void;
}

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
  isLoading = false,
  formatCurrency,
  onEdit,
  onDelete,
  onAdd,
}: EmpenhoTableProps) {
  const { canEditAdministrativo } = usePermission();
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(empenhos.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmpenhos = useMemo(
    () => empenhos.slice(startIndex, startIndex + ITEMS_PER_PAGE),
    [empenhos, startIndex],
  );

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-muted border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Empenho
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Empresa
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden lg:table-cell">
                Descrição
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden md:table-cell">
                Prazo
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Valor
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Progresso
              </th>
              {canEditAdministrativo && (
                <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedEmpenhos.map((empenho) => {
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

                  {canEditAdministrativo && (
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEdit(empenho)}
                          className="p-2 hover:bg-primary-100 cursor-pointer text-text-secondary hover:text-primary-500 rounded-md transition-colors"
                          title="Gerenciar"
                        >
                          <Eye size={16} />
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

      {/* Empty State */}
      {paginatedEmpenhos.length === 0 &&
        (isLoading ? (
          <div className="py-12 text-center">
            <Loader2
              size={32}
              className="mx-auto text-primary-500 animate-spin mb-3"
            />
            <p className="text-text-secondary text-sm">
              Carregando empenhos...
            </p>
          </div>
        ) : (
          <div className="py-12 text-center">
            <Layers2 size={48} className="mx-auto text-text-muted mb-4" />
            <p className="text-text-secondary font-medium">
              Nenhum empenho encontrado
            </p>
            <p className="text-text-muted text-sm mt-1">
              Tente ajustar os filtros ou cadastre um novo empenho
            </p>
            {onAdd && (
              <button
                onClick={onAdd}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-md cursor-pointer transition-colors"
              >
                <Plus size={16} />
                Cadastrar empenho
              </button>
            )}
          </div>
        ))}

      <EmpenhoPagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        totalItems={empenhos.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setPage}
      />
    </div>
  );
}
