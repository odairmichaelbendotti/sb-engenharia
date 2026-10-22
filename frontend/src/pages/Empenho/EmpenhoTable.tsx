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
import { Button, IconButton, Pagination, Table, TableBody, TableHead, Td, Th, Tr } from "../../components/ui";

const ITEMS_PER_PAGE = 10;

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
      <Table>
        <TableHead>
          <Th>Empenho</Th>
          <Th wrap className="hidden md:table-cell">Descrição</Th>
          <Th className="hidden md:table-cell">Prazo</Th>
          <Th>Saldo</Th>
          {canEditAdministrativo && <Th>Ações</Th>}
        </TableHead>
        <TableBody>
          {paginatedEmpenhos.map((empenho) => {
            const isNearDeadline =
              empenho.status.toLowerCase() === "ativo" &&
              new Date(empenho.endAt) <
                new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000);

            return (
              <Tr key={empenho.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-surface-muted border border-border rounded-lg flex items-center justify-center shrink-0">
                      <Layers2 size={16} className="text-text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{empenho.numero}</p>
                      <p className="text-xs text-text-secondary">{formatDate(empenho.startAt)}</p>
                    </div>
                  </div>
                </Td>
                {/* Descrição: até duas linhas, texto completo ao passar o mouse */}
                <Td wrap className="hidden md:table-cell">
                  <p className="line-clamp-2 text-text-secondary" title={empenho.description}>
                    {empenho.description}
                  </p>
                </Td>
                <Td className="hidden md:table-cell">
                  <span className={isNearDeadline ? "text-warning-text font-medium" : "text-text-primary"}>
                    {formatDate(empenho.endAt)}
                  </span>
                  {isNearDeadline && <p className="text-xs text-warning-text">Prazo próximo</p>}
                </Td>
                {/* O valor do empenho já aparece no saldo ("de R$ ..."): sem coluna própria */}
                <Td>
                  <SaldoLiquidacao
                    valor={empenho.value}
                    liquidado={empenho.valorLiquidado}
                    saldo={empenho.saldoALiquidar}
                    liquidadoLabel="Empenho liquidado"
                  />
                </Td>
                {canEditAdministrativo && (
                  <Td>
                    <div className="flex items-center gap-1">
                      <IconButton icon={Edit2} label="Gerenciar" size="sm" onClick={() => onEdit(empenho)} />
                      <IconButton
                        icon={Trash2}
                        label="Excluir"
                        size="sm"
                        variant="danger"
                        onClick={() => onDelete(empenho)}
                      />
                    </div>
                  </Td>
                )}
              </Tr>
            );
          })}
        </TableBody>
      </Table>

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
