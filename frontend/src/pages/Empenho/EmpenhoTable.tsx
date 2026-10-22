import {
  Layers2,
  Trash2,
  Edit2,
  Loader2,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { EmpenhoList } from "../../../types/empenho";
import { formatDate } from "../../utils/format-currency";
import { usePermission } from "../../hooks/usePermission";
import { SaldoLiquidacao } from "../../components/SaldoLiquidacao";
import { Button, IconButton, Pagination } from "../../components/ui";

const ITEMS_PER_PAGE = 10;

const thClass = "text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wide";

interface EmpenhoTableProps {
  empenhos: EmpenhoList[];
  isLoading?: boolean;
  onEdit: (empenho: EmpenhoList) => void;
  onDelete: (empenho: EmpenhoList) => void;
  onAdd?: () => void;
}

export function EmpenhoTable({
  empenhos,
  isLoading = false,
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
        <table className="w-full text-table">
          <thead className="bg-surface-muted border-b border-border">
            <tr>
              <th className={thClass}>Empenho</th>
              <th className={`${thClass} hidden md:table-cell`}>Descrição</th>
              <th className={`${thClass} hidden md:table-cell`}>Prazo</th>
              <th className={thClass}>Saldo</th>
              {canEditAdministrativo && (
                <th className="text-right py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wide">
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
                      <div className="w-9 h-9 bg-surface-muted border border-border rounded-lg flex items-center justify-center shrink-0">
                        <Layers2 size={16} className="text-text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary text-table">
                          {empenho.numero}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {formatDate(empenho.startAt)}
                        </p>
                      </div>
                    </div>
                  </td>
                  {/* Descrição ocupa o espaço livre: até duas linhas, texto completo ao passar o mouse */}
                  <td className="py-3 px-4 text-table text-text-secondary hidden md:table-cell w-full">
                    <p className="line-clamp-2 min-w-48" title={empenho.description}>
                      {empenho.description}
                    </p>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap hidden md:table-cell">
                    <div className="text-table">
                      <span
                        className={
                          isNearDeadline ? "text-warning-text font-medium" : "text-text-primary"
                        }
                      >
                        {formatDate(empenho.endAt)}
                      </span>
                      {isNearDeadline && (
                        <p className="text-xs text-warning-text">Prazo próximo</p>
                      )}
                    </div>
                  </td>
                  {/* O valor do empenho já aparece no saldo ("de R$ ..."): sem coluna própria */}
                  <td className="py-3 px-4 min-w-44">
                    <SaldoLiquidacao
                      valor={empenho.value}
                      liquidado={empenho.valorLiquidado}
                      saldo={empenho.saldoALiquidar}
                      liquidadoLabel="Empenho liquidado"
                    />
                  </td>

                  {canEditAdministrativo && (
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          icon={Edit2}
                          label="Gerenciar"
                          size="sm"
                          onClick={() => onEdit(empenho)}
                        />
                        <IconButton
                          icon={Trash2}
                          label="Excluir"
                          size="sm"
                          variant="danger"
                          onClick={() => onDelete(empenho)}
                        />
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
              className="mx-auto text-text-muted animate-spin mb-3"
            />
            <p className="text-text-secondary text-sm">
              Carregando empenhos...
            </p>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Layers2 size={32} className="mx-auto text-text-muted mb-3" />
            <p className="text-sm text-text-secondary font-medium">
              Nenhum empenho encontrado
            </p>
            <p className="text-text-muted text-sm mt-1">
              Tente ajustar os filtros ou cadastre um novo empenho
            </p>
            {onAdd && (
              <Button icon={Plus} onClick={onAdd} className="mt-4">
                Cadastrar empenho
              </Button>
            )}
          </div>
        ))}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        totalItems={empenhos.length}
        itemsPerPage={ITEMS_PER_PAGE}
        itemLabel="empenhos"
        onPageChange={setPage}
      />
    </div>
  );
}
