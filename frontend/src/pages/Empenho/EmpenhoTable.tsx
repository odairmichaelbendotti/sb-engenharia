import { Edit2, Eye, FilePlus2, Layers2, Loader2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { EmpenhoList } from "../../../types/empenho";
import { formatCurrency, formatDateOnly } from "../../utils/format-currency";
import { empenhoStatusDisplay, getDeadlineHint } from "../../utils/status-display";
import { usePermission } from "../../hooks/usePermission";
import { useContratos } from "../../store/contratos";
import { BalanceCell } from "../../components/BalanceCell";
import {
  ActionMenu,
  Button,
  CodeTag,
  DateHint,
  Pagination,
  StatusPill,
  Table,
  TableBody,
  TableHead,
  Td,
  Th,
  Tr,
} from "../../components/ui";

const ITEMS_PER_PAGE = 10;

interface EmpenhoTableProps {
  empenhos: EmpenhoList[];
  isLoading?: boolean;
  onView: (empenho: EmpenhoList) => void;
  onEdit: (empenho: EmpenhoList) => void;
  onDelete: (empenho: EmpenhoList) => void;
  // Nova nota fiscal já com este empenho (abre na tela de notas)
  onNewInvoice?: (empenho: EmpenhoList) => void;
  onAdd?: () => void;
}

const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

export function EmpenhoTable({ empenhos, isLoading = false, onView, onEdit, onDelete, onNewInvoice, onAdd }: EmpenhoTableProps) {
  const { canEditAdministrativo } = usePermission();
  // Cor do contrato do empenho (faixa à esquerda da linha)
  const contratos = useContratos((s) => s.data?.contratos);
  const corPorContrato = useMemo(() => new Map((contratos ?? []).map((c) => [c.id, c.cor])), [contratos]);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(empenhos.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmpenhos = useMemo(() => empenhos.slice(startIndex, startIndex + ITEMS_PER_PAGE), [empenhos, startIndex]);

  return (
    <div>
      <Table>
        <TableHead>
          <Th>Empenho</Th>
          <Th width="w-36" className="hidden xl:table-cell">
            Status
          </Th>
          <Th width="w-36" className="hidden lg:table-cell">
            Vigência
          </Th>
          <Th width="w-44" className="hidden 2xl:table-cell">
            Destinado a OS
          </Th>
          <Th width="w-48" className="hidden sm:table-cell">
            Saldo
          </Th>
          <Th actions />
        </TableHead>
        <TableBody>
          {paginatedEmpenhos.map((empenho) => {
            const status = empenhoStatusDisplay(empenho.status, String(empenho.endAt));
            const active = empenho.status.toUpperCase() === "ATIVO";
            const cancelado = empenho.status.toUpperCase() === "CANCELADO";
            const vigencia = getDeadlineHint(String(empenho.endAt), { active });
            return (
              <Tr key={empenho.id} onOpen={() => onView(empenho)} muted={cancelado}>
                <Td accent={corPorContrato.get(empenho.contrato_id)}>
                  <p className="font-semibold text-text-primary truncate" title={empenho.description}>
                    {empenho.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-1 text-[11px] text-text-muted min-w-0">
                    <CodeTag>{empenho.numero}</CodeTag>
                    <span className="truncate">
                      {empenho.contrato.identificador} · {empenho.contrato.company.name}
                    </span>
                    <span className="xl:hidden">
                      <StatusPill tone={status.tone} size="sm">
                        {status.label}
                      </StatusPill>
                    </span>
                  </div>
                </Td>
                <Td className="hidden xl:table-cell">
                  <StatusPill tone={status.tone} title={status.title}>
                    {status.label}
                  </StatusPill>
                </Td>
                <Td className="hidden lg:table-cell">
                  <DateHint date={formatDateOnly(empenho.endAt)} hint={vigencia} />
                </Td>
                <Td className="hidden 2xl:table-cell">
                  <span className="inline-flex flex-col">
                    <span className="text-text-primary tabular-nums">{formatCurrency(empenho.valorComprometido)}</span>
                    <span className={`text-[11px] ${empenho.saldoDisponivel < 0 ? "text-danger-text font-semibold" : "text-text-muted"}`}>
                      {empenho.saldoDisponivel < 0
                        ? "acima do empenho"
                        : `${pct(empenho.valorComprometido, empenho.value)}% · ${formatCurrency(empenho.saldoDisponivel)} livre`}
                    </span>
                  </span>
                </Td>
                <Td className="hidden sm:table-cell">
                  <BalanceCell
                    valor={empenho.value}
                    liquidado={empenho.valorLiquidado}
                    paidLabel="Liquidado"
                    inactive={cancelado}
                  />
                </Td>
                <Td actions>
                  <ActionMenu
                    label={`Ações do empenho ${empenho.numero}`}
                    items={[
                      { label: "Visualizar", icon: Eye, onClick: () => onView(empenho) },
                      { label: "Editar", icon: Edit2, onClick: () => onEdit(empenho), hidden: !canEditAdministrativo },
                      {
                        label: "Nova nota fiscal",
                        icon: FilePlus2,
                        onClick: () => onNewInvoice?.(empenho),
                        hidden: !canEditAdministrativo || !onNewInvoice || !active,
                      },
                      {
                        label: "Excluir",
                        icon: Trash2,
                        onClick: () => onDelete(empenho),
                        danger: true,
                        hidden: !canEditAdministrativo,
                      },
                    ]}
                  />
                </Td>
              </Tr>
            );
          })}
        </TableBody>
      </Table>

      {paginatedEmpenhos.length === 0 &&
        (isLoading ? (
          <div className="py-10 text-center">
            <Loader2 size={28} className="mx-auto text-text-muted animate-spin mb-2" />
            <p className="text-text-secondary text-sm">Carregando empenhos...</p>
          </div>
        ) : (
          <div className="py-10 text-center">
            <Layers2 size={28} className="mx-auto text-text-muted mb-2" />
            <p className="text-sm text-text-secondary font-medium">Nenhum empenho encontrado</p>
            <p className="text-text-muted text-xs mt-1">Tente ajustar os filtros ou cadastre um novo empenho</p>
            {onAdd && canEditAdministrativo && (
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
