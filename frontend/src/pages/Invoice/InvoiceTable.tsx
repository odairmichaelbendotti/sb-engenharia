import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock,
  Edit2,
  FileText,
  HardHat,
  Trash2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { Invoice } from "../../../types/invoice";
import { usePermission } from "../../hooks/usePermission";
import { formatCurrency, formatDateOnly } from "../../utils/format-currency";
import { cx } from "../../utils/cx";
import {
  Badge,
  IconButton,
  Pagination,
  Table,
  TableBody,
  TableHead,
  Td,
  Th,
  Tr,
  type BadgeTone,
} from "../../components/ui";

const ITEMS_PER_PAGE = 10;

const STATUS_DISPLAY: Record<string, { label: string; tone: BadgeTone; icon: LucideIcon }> = {
  PAGO: { label: "Pago", tone: "success", icon: CheckCircle2 },
  VENCIDO: { label: "Vencido", tone: "danger", icon: AlertCircle },
  CANCELADO: { label: "Cancelado", tone: "neutral", icon: XCircle },
  PENDENTE: { label: "Pendente", tone: "warning", icon: Clock },
};

type SortKey = "vencimento" | "value";
type SortDir = "asc" | "desc";

type InvoiceTableProps = {
  allInvoices: Invoice[];
  setDeleteInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
  setEditInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
};

function SortHeader({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  const active = sortKey === k;
  const Icon = active && sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <Th className={className}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className="inline-flex items-center gap-1 cursor-pointer hover:text-text-primary transition-colors"
      >
        {label}
        <Icon size={12} className={active ? "text-text-primary" : "text-text-muted"} />
      </button>
    </Th>
  );
}

const InvoiceTable = ({ allInvoices, setDeleteInvoice, setEditInvoice }: InvoiceTableProps) => {
  const { canEditAdministrativo } = usePermission();
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
          <Th wrap>Nota fiscal</Th>
          <Th className="hidden md:table-cell">Origem</Th>
          <Th className="hidden lg:table-cell">Empresa</Th>
          <SortHeader
            label="Vencimento"
            k="vencimento"
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            className="hidden sm:table-cell"
          />
          <SortHeader label="Valor" k="value" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
          <Th>Status</Th>
          {canEditAdministrativo && (
            <Th>
              <span className="sr-only">Ações</span>
            </Th>
          )}
        </TableHead>
        <TableBody>
          {paginatedInvoices.map((invoice) => {
            const status = STATUS_DISPLAY[invoice.status?.toUpperCase()] ?? STATUS_DISPLAY.PENDENTE!;
            const isVencido = invoice.status?.toUpperCase() === "VENCIDO";
            const isCancelado = invoice.status?.toUpperCase() === "CANCELADO";

            return (
              <Tr
                key={invoice.id}
                className={cx("group", isVencido && "border-l-2 border-l-danger-text", isCancelado && "opacity-60")}
              >
                {/* Descrição quebra em até duas linhas; texto completo ao passar o mouse */}
                <Td wrap>
                  <p className="font-medium text-text-primary">{invoice.numero}</p>
                  <p className="text-xs text-text-muted line-clamp-2" title={invoice.description}>
                    {invoice.description}
                  </p>
                </Td>
                <Td className="hidden md:table-cell">
                  {invoice.empenho && <p className="text-text-primary font-medium">{invoice.empenho.numero}</p>}
                  {(invoice.ordemServico || invoice.obra) && (
                    // Uma linha só: nome longo da obra termina em reticências
                    <p
                      className="inline-flex max-w-72 items-center gap-1 text-xs text-text-muted"
                      title={[invoice.ordemServico && `OS ${invoice.ordemServico.numero}`, invoice.obra?.nome]
                        .filter(Boolean)
                        .join(" · ")}
                    >
                      <HardHat size={12} className="shrink-0" />
                      <span className="truncate">
                        {invoice.ordemServico && <>OS {invoice.ordemServico.numero}</>}
                        {invoice.ordemServico && invoice.obra && " · "}
                        {invoice.obra?.nome}
                      </span>
                    </p>
                  )}
                </Td>
                <Td className="hidden lg:table-cell">
                  <p className="max-w-56 truncate text-text-secondary" title={invoice.company?.name}>
                    {invoice.company?.name ?? "—"}
                  </p>
                </Td>
                <Td className="hidden sm:table-cell">
                  <span className="text-text-secondary">{formatDateOnly(invoice.vencimento)}</span>
                </Td>
                <Td>
                  <span className="font-semibold text-text-primary">{formatCurrency(invoice.value)}</span>
                </Td>
                <Td>
                  <Badge tone={status.tone} icon={status.icon}>
                    {status.label}
                  </Badge>
                </Td>
                {canEditAdministrativo && (
                  <Td>
                    {/* Ações discretas: aparecem ao passar o mouse */}
                    <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
                      <IconButton
                        icon={Edit2}
                        label="Editar nota fiscal"
                        size="sm"
                        onClick={() => setEditInvoice(invoice)}
                      />
                      <IconButton
                        icon={Trash2}
                        label="Excluir nota fiscal"
                        size="sm"
                        variant="danger"
                        onClick={() => setDeleteInvoice(invoice)}
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
      {paginatedInvoices.length === 0 && (
        <div className="py-8 text-center">
          <FileText size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-sm text-text-secondary font-medium">Nenhuma nota fiscal encontrada</p>
          <p className="text-text-muted text-sm mt-1">Tente ajustar os filtros ou cadastre uma nova nota fiscal</p>
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
