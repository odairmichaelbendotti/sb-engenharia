import {
  Layers2,
  Building2,
  Trash2,
  Edit2,
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
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase">
                Empenho
              </th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase">
                Contrato
              </th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase hidden lg:table-cell">
                Descrição
              </th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase hidden md:table-cell">
                Prazo
              </th>
              <th className="text-center py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase">
                Valor
              </th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase">
                Saldo
              </th>
              {canEditAdministrativo && (
                <th className="text-right py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase">
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
                  <td className="py-2.5 px-4">
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
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-text-muted" />
                      <div>
                        <span className="text-sm text-text-primary">
                          {empenho.contrato.identificador}
                        </span>
                        <p className="text-xs text-text-secondary">
                          {empenho.contrato.company.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-sm text-text-secondary hidden lg:table-cell">
                    <p className="truncate max-w-50">{empenho.description}</p>
                  </td>
                  <td className="py-2.5 px-4 hidden md:table-cell">
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
                  <td className="py-2.5 px-4 text-right">
                    <p className="font-semibold text-text-primary text-sm">
                      {formatCurrency(empenho.value)}
                    </p>
                  </td>
                  <td className="py-2.5 px-4 min-w-40">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span
                          className={`font-semibold ${empenho.saldoDisponivel <= 0 ? "text-danger-text" : "text-text-primary"}`}
                        >
                          {formatCurrency(empenho.saldoDisponivel)}
                        </span>
                        <span className="text-text-muted shrink-0">de {formatCurrency(empenho.value)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            empenho.saldoDisponivel <= 0
                              ? "bg-danger-text"
                              : empenho.valorComprometido / empenho.value >= 0.8
                                ? "bg-warning-text"
                                : "bg-primary-500"
                          }`}
                          style={{ width: `${Math.min(100, (empenho.valorComprometido / empenho.value) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {canEditAdministrativo && (
                    <td className="py-2.5 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEdit(empenho)}
                          className="p-2 hover:bg-primary-100 cursor-pointer text-text-secondary hover:text-primary-500 rounded-md transition-colors"
                          title="Gerenciar"
                        >
                          <Edit2 size={16} />
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
          <div className="py-8 text-center">
            <Loader2
              size={32}
              className="mx-auto text-primary-500 animate-spin mb-3"
            />
            <p className="text-text-secondary text-sm">
              Carregando empenhos...
            </p>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Layers2 size={32} className="mx-auto text-text-muted mb-3" />
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
