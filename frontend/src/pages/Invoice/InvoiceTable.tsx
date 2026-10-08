import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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

const ITEMS_PER_PAGE = 10;

const STATUS_DISPLAY: Record<string, { label: string; className: string; icon: LucideIcon }> = {
  PAGO: { label: "Pago", className: "bg-success-bg text-success-text border-success-border", icon: CheckCircle2 },
  VENCIDO: { label: "Vencido", className: "bg-danger-bg text-danger-text border-danger-border", icon: AlertCircle },
  CANCELADO: { label: "Cancelado", className: "bg-surface-muted text-text-muted border-border", icon: XCircle },
  PENDENTE: { label: "Pendente", className: "bg-warning-bg text-warning-text border-warning-border", icon: Clock },
};

type SortKey = "vencimento" | "value";
type SortDir = "asc" | "desc";

type InvoiceTableProps = {
  allInvoices: Invoice[];
  setDeleteInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
  setEditInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
};

const thClass = "text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase";

function SortHeader({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
  className = "",
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
    <th className={`${thClass} ${className}`}>
      <button
        onClick={() => onSort(k)}
        className="inline-flex items-center gap-1 uppercase cursor-pointer hover:text-text-primary transition-colors"
      >
        {label}
        <Icon size={12} className={active ? "text-primary-500" : "text-text-muted"} />
      </button>
    </th>
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
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-muted border-b border-border">
            <tr>
              <th className={thClass}>Nota fiscal</th>
              <th className={`${thClass} hidden md:table-cell`}>Origem</th>
              <th className={`${thClass} hidden lg:table-cell`}>Empresa</th>
              <SortHeader
                label="Vencimento"
                k="vencimento"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                className="hidden sm:table-cell"
              />
              <SortHeader
                label="Valor"
                k="value"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                className="text-right!"
              />
              {/* Largura fixa: sem ela a coluna fica do tamanho do selo e o alinhamento à direita não aparece */}
              <th className={`${thClass} text-right! w-36`}>Status</th>
              {canEditAdministrativo && <th className={`w-px ${thClass}`} aria-label="Ações" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedInvoices.map((invoice) => {
              const status = STATUS_DISPLAY[invoice.status?.toUpperCase()] ?? STATUS_DISPLAY.PENDENTE!;
              const StatusIcon = status.icon;
              const isVencido = invoice.status?.toUpperCase() === "VENCIDO";
              const isCancelado = invoice.status?.toUpperCase() === "CANCELADO";

              return (
                <tr
                  key={invoice.id}
                  className={`group hover:bg-surface-muted/50 transition-colors ${
                    isVencido ? "border-l-2 border-l-danger-text" : ""
                  } ${isCancelado ? "opacity-60" : ""}`}
                >
                  <td className="py-2.5 px-4 max-w-64">
                    <p className="font-medium text-text-primary text-sm">{invoice.numero}</p>
                    <p className="text-xs text-text-muted truncate" title={invoice.description}>
                      {invoice.description}
                    </p>
                  </td>
                  <td className="py-2.5 px-4 hidden md:table-cell max-w-72">
                    {invoice.empenho && (
                      <p className="text-sm text-text-primary font-medium tabular-nums">{invoice.empenho.numero}</p>
                    )}
                    {(invoice.ordemServico || invoice.obra) && (
                      <p
                        className="flex items-center gap-1 text-xs text-text-muted min-w-0"
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
                  </td>
                  <td className="py-2.5 px-4 text-sm text-text-secondary hidden lg:table-cell max-w-56">
                    <p className="truncate" title={invoice.company?.name}>
                      {invoice.company?.name ?? "—"}
                    </p>
                  </td>
                  <td className="py-2.5 px-4 text-sm text-text-secondary tabular-nums hidden sm:table-cell">
                    {formatDateOnly(invoice.vencimento)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-text-primary text-sm tabular-nums whitespace-nowrap">
                    {formatCurrency(invoice.value)}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${status.className}`}
                    >
                      <StatusIcon size={10} />
                      {status.label}
                    </span>
                  </td>
                  {canEditAdministrativo && (
                    <td className="py-2.5 px-3">
                      {/* Ações discretas: aparecem ao passar o mouse */}
                      <div className="flex items-center justify-end gap-0.5 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
                        <button
                          className="p-1.5 cursor-pointer text-text-muted hover:text-primary-500 hover:bg-primary-100 rounded-md transition-colors"
                          title="Editar nota fiscal"
                          onClick={() => setEditInvoice(invoice)}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="p-1.5 cursor-pointer text-text-muted hover:text-danger-text hover:bg-danger-bg rounded-md transition-colors"
                          title="Excluir nota fiscal"
                          onClick={() => setDeleteInvoice(invoice)}
                        >
                          <Trash2 size={15} />
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
      {paginatedInvoices.length === 0 && (
        <div className="py-8 text-center">
          <FileText size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-text-secondary font-medium">Nenhuma nota fiscal encontrada</p>
          <p className="text-text-muted text-sm mt-1">Tente ajustar os filtros ou cadastre uma nova nota fiscal</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-muted">
          <p className="text-sm text-text-secondary">
            Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, sorted.length)} de {sorted.length} notas
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 hover:bg-surface cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-text-secondary">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-surface cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceTable;
