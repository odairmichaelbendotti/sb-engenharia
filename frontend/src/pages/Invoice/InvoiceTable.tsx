import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Edit2, Eye, FileText, Trash2 } from "lucide-react";
import type { Invoice } from "../../../types/invoice";
import { usePermission } from "../../hooks/usePermission";
import { useContratos } from "../../store/contratos";
import { formatCurrency, formatDateOnly } from "../../utils/format-currency";
import { getDeadlineHint, invoiceStatusDisplay, invoiceLabel } from "../../utils/status-display";
import {
  ActionMenu,
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

type SortKey = "vencimento" | "value";
type SortDir = "asc" | "desc";

type InvoiceTableProps = {
  allInvoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  // Abre a confirmação de "Marcar como paga" (no modal da nota)
  onMarkPaid: (invoice: Invoice) => void;
};

function SortButton({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = sortKey === k;
  const Icon = sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(k)}
      className={`inline-flex items-center gap-1 cursor-pointer uppercase hover:text-text-primary transition-colors ${active ? "text-text-primary" : ""}`}
    >
      {label}
      {active && <Icon size={11} />}
    </button>
  );
}

const isOpenStatus = (status: string) => ["PENDENTE", "VENCIDO"].includes(status.toUpperCase());

// Dica do vencimento: corre só enquanto a nota está em aberto; paga mostra só a data
function vencimentoHint(invoice: Invoice) {
  const hint = getDeadlineHint(invoice.vencimento, { active: isOpenStatus(invoice.status), dueSoonDays: 10 });
  if (!hint) return null;
  // Nota em aberto com prazo longo: a data basta
  return hint.tone === "muted" ? null : hint;
}

const InvoiceTable = ({ allInvoices, onView, onEdit, onDelete, onMarkPaid }: InvoiceTableProps) => {
  const { canEditAdministrativo } = usePermission();
  // Cor do contrato da nota (faixa à esquerda da linha); a lista de contratos vem da página
  const contratos = useContratos((s) => s.data?.contratos);
  const corPorContrato = useMemo(() => new Map((contratos ?? []).map((c) => [c.id, c.cor])), [contratos]);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("vencimento");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...allInvoices].sort((a, b) =>
      sortKey === "value"
        ? (a.value - b.value) * dir
        : (new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()) * dir,
    );
  }, [allInvoices, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedInvoices = useMemo(() => sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE), [sorted, startIndex]);

  return (
    <div>
      <Table>
        <TableHead>
          <Th>Nota fiscal</Th>
          <Th width="w-32" className="hidden lg:table-cell">
            Status
          </Th>
          <Th width="w-36" className="hidden lg:table-cell">
            <SortButton label="Vencimento" k="vencimento" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
          </Th>
          <Th width="w-64" className="hidden xl:table-cell">
            Origem
          </Th>
          <Th width="w-36">
            <SortButton label="Valor" k="value" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
          </Th>
          <Th actions />
        </TableHead>
        <TableBody>
          {paginatedInvoices.map((invoice) => {
            const status = invoiceStatusDisplay(invoice.status);
            const cancelada = invoice.status?.toUpperCase() === "CANCELADO";
            const contratoId = invoice.empenho?.contrato?.id;
            return (
              <Tr key={invoice.id} onOpen={() => onView(invoice)} muted={cancelada}>
                <Td accent={contratoId ? corPorContrato.get(contratoId) : null}>
                  <p className="font-semibold text-text-primary">{invoiceLabel(invoice.numero)}</p>
                  <p className="text-[11px] text-text-muted truncate" title={invoice.description}>
                    {invoice.description || "Sem descrição"}
                  </p>
                  {/* Sem as colunas de status e origem (telas menores), o essencial vem aqui */}
                  <div className="xl:hidden mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-text-muted">
                    <span className="lg:hidden">
                      <StatusPill tone={status.tone} size="sm">
                        {status.label}
                      </StatusPill>
                    </span>
                    <span className="lg:hidden">vence {formatDateOnly(invoice.vencimento)} ·</span>
                    <span className="truncate">{invoice.company?.name}</span>
                  </div>
                </Td>
                <Td className="hidden lg:table-cell">
                  <StatusPill tone={status.tone}>{status.label}</StatusPill>
                </Td>
                <Td className="hidden lg:table-cell">
                  <DateHint date={formatDateOnly(invoice.vencimento)} hint={vencimentoHint(invoice)} />
                </Td>
                <Td className="hidden xl:table-cell">
                  <p className="truncate text-text-primary" title={invoice.company?.name}>
                    {invoice.company?.name ?? "—"}
                  </p>
                  <div
                    className="flex items-center justify-center gap-1.5 mt-0.5 text-[11px] text-text-muted min-w-0"
                    title={[invoice.empenho?.numero, invoice.ordemServico?.numero, invoice.obra?.nome].filter(Boolean).join(" · ")}
                  >
                    {invoice.empenho && <span className="font-medium text-text-secondary shrink-0">{invoice.empenho.numero}</span>}
                    {invoice.ordemServico && (
                      <CodeTag className="truncate">
                        {/^OS\b/i.test(invoice.ordemServico.numero) ? invoice.ordemServico.numero : `OS ${invoice.ordemServico.numero}`}
                      </CodeTag>
                    )}
                  </div>
                </Td>
                <Td>
                  <span className={`font-semibold tabular-nums ${cancelada ? "text-text-muted line-through" : "text-text-primary"}`}>
                    {formatCurrency(invoice.value)}
                  </span>
                </Td>
                <Td actions>
                  <ActionMenu
                    label={`Ações da nota ${invoice.numero}`}
                    items={[
                      { label: "Visualizar", icon: Eye, onClick: () => onView(invoice) },
                      { label: "Editar", icon: Edit2, onClick: () => onEdit(invoice), hidden: !canEditAdministrativo },
                      {
                        label: "Marcar como paga",
                        icon: CheckCircle2,
                        onClick: () => onMarkPaid(invoice),
                        hidden: !canEditAdministrativo || !isOpenStatus(invoice.status),
                      },
                      {
                        label: "Excluir",
                        icon: Trash2,
                        onClick: () => onDelete(invoice),
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

      {paginatedInvoices.length === 0 && (
        <div className="py-10 text-center">
          <FileText size={28} className="mx-auto text-text-muted mb-2" />
          <p className="text-sm text-text-secondary font-medium">Nenhuma nota fiscal encontrada</p>
          <p className="text-text-muted text-xs mt-1">Tente ajustar os filtros ou cadastre uma nova nota fiscal</p>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        totalItems={sorted.length}
        itemsPerPage={ITEMS_PER_PAGE}
        itemLabel="notas"
        onPageChange={setPage}
      />
    </div>
  );
};

export default InvoiceTable;
