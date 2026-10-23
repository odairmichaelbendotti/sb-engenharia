import { ClipboardPlus, Edit2, Eye, FileSignature, Loader2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { Contrato } from "../../../types/contrato";
import { usePermission } from "../../hooks/usePermission";
import { formatCurrency, formatDateOnly } from "../../utils/format-currency";
import { contratoStatusDisplay, getDeadlineHint } from "../../utils/status-display";
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

interface ContratoTableProps {
  contratos: Contrato[];
  isLoading?: boolean;
  onView: (contrato: Contrato) => void;
  onEdit: (contrato: Contrato) => void;
  onDelete: (contrato: Contrato) => void;
  // Nova OS já neste contrato (abre na tela de ordens de serviço)
  onNewOrdemServico?: (contrato: Contrato) => void;
  onAdd?: () => void;
}

const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

export function ContratoTable({
  contratos,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
  onNewOrdemServico,
  onAdd,
}: ContratoTableProps) {
  const { canEditAdministrativo, canCreateOrdemServico } = usePermission();
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(contratos.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedContratos = useMemo(() => contratos.slice(startIndex, startIndex + ITEMS_PER_PAGE), [contratos, startIndex]);

  return (
    <div>
      <Table>
        <TableHead>
          <Th>Contrato</Th>
          <Th width="w-36" className="hidden xl:table-cell">
            Status
          </Th>
          <Th width="w-36" className="hidden lg:table-cell">
            Vigência
          </Th>
          <Th width="w-44" className="hidden 2xl:table-cell">
            Empenhado
          </Th>
          <Th width="w-48" className="hidden sm:table-cell">
            Saldo
          </Th>
          <Th actions />
        </TableHead>
        <TableBody>
          {paginatedContratos.map((contrato) => {
            const status = contratoStatusDisplay(contrato.status, String(contrato.dataFim));
            const vigencia = getDeadlineHint(String(contrato.dataFim), {
              active: contrato.status === "ATIVO",
              dueSoonDays: 60,
            });
            return (
              <Tr key={contrato.id} onOpen={() => onView(contrato)} muted={contrato.status === "CANCELADO"}>
                <Td accent={contrato.cor}>
                  <p className="font-semibold text-text-primary truncate" title={contrato.descricaoCurta}>
                    {contrato.descricaoCurta}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-1 text-[11px] text-text-muted min-w-0">
                    <CodeTag>{contrato.identificador}</CodeTag>
                    <span className="truncate">{contrato.company.name}</span>
                    <span>
                      · {contrato.empenhos.length} {contrato.empenhos.length === 1 ? "empenho" : "empenhos"}
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
                  <DateHint date={formatDateOnly(contrato.dataFim)} hint={vigencia} />
                </Td>
                <Td className="hidden 2xl:table-cell">
                  <span className="inline-flex flex-col">
                    <span className="text-text-primary tabular-nums">{formatCurrency(contrato.valorEmpenhado)}</span>
                    <span className="text-[11px] text-text-muted">
                      {pct(contrato.valorEmpenhado, contrato.valor)}% de {formatCurrency(contrato.valor)}
                    </span>
                  </span>
                </Td>
                <Td className="hidden sm:table-cell">
                  <BalanceCell
                    valor={contrato.valor}
                    liquidado={contrato.valorLiquidado}
                    paidLabel="Liquidado"
                    inactive={contrato.status === "CANCELADO"}
                  />
                </Td>
                <Td actions>
                  <ActionMenu
                    label={`Ações do contrato ${contrato.identificador}`}
                    items={[
                      { label: "Visualizar", icon: Eye, onClick: () => onView(contrato) },
                      { label: "Editar", icon: Edit2, onClick: () => onEdit(contrato), hidden: !canEditAdministrativo },
                      {
                        label: "Nova OS neste contrato",
                        icon: ClipboardPlus,
                        onClick: () => onNewOrdemServico?.(contrato),
                        hidden: !canCreateOrdemServico || !onNewOrdemServico || contrato.status !== "ATIVO",
                      },
                      {
                        label: "Excluir",
                        icon: Trash2,
                        onClick: () => onDelete(contrato),
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

      {paginatedContratos.length === 0 &&
        (isLoading ? (
          <div className="py-10 text-center">
            <Loader2 size={28} className="mx-auto text-text-muted animate-spin mb-2" />
            <p className="text-text-secondary text-sm">Carregando contratos...</p>
          </div>
        ) : (
          <div className="py-10 text-center">
            <FileSignature size={28} className="mx-auto text-text-muted mb-2" />
            <p className="text-sm text-text-secondary font-medium">Nenhum contrato encontrado</p>
            <p className="text-text-muted text-xs mt-1">Tente ajustar os filtros ou cadastre um novo contrato</p>
            {onAdd && canEditAdministrativo && (
              <Button icon={Plus} onClick={onAdd} className="mt-4">
                Cadastrar contrato
              </Button>
            )}
          </div>
        ))}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        totalItems={contratos.length}
        itemsPerPage={ITEMS_PER_PAGE}
        itemLabel="contratos"
        onPageChange={setPage}
      />
    </div>
  );
}
