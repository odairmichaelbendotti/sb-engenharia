import { Trash2, Edit2, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { Obra } from "../../../types/obra";
import { formatCurrency, formatDate, formatDateOnly } from "../../utils/format-currency";
import { usePermission } from "../../hooks/usePermission";
import { OrdemServicoNumeroTag } from "../../components/OrdemServicoNumeroTag";
import { OBRA_TIPO_LABEL, getObraBalance, getObraDeadlineHint } from "./obra-display";
import { CompleteObraButton } from "./CompleteObraButton";

const ITEMS_PER_PAGE = 10;

interface ObraTableProps {
  obras: Obra[];
  onView: (obra: Obra) => void;
  onEdit: (obra: Obra) => void;
  onDelete: (obra: Obra) => void;
}

type SortKey = "nome" | "dataPrevisaoTermino" | "valor";
type SortDir = "asc" | "desc";

function SortIcon({ k, sortKey, sortDir }: { k: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== k) return <ArrowUp size={12} className="text-text-muted" />;
  return sortDir === "asc" ? (
    <ArrowUp size={12} className="text-primary-500" />
  ) : (
    <ArrowDown size={12} className="text-primary-500" />
  );
}

// "+N" quando a lista não cabe na linha; o title mostra todos
function compactList(items: string[], max: number) {
  if (items.length <= max) return items.join(", ");
  return `${items.slice(0, max).join(", ")} +${items.length - max}`;
}

const MAX_OS_TAGS = 2;

function getOrigem(obra: Obra) {
  const empenhos = [...new Set(obra.ordensServico.flatMap((os) => os.empenhos.map((v) => v.numero)))];
  const os = obra.ordensServico.map((o) => o.numero);
  return {
    empenhos: compactList(empenhos, 2),
    os,
    title: `Empenhos: ${empenhos.join(", ") || "—"}\nOS: ${os.join(", ") || "—"}`,
  };
}

// Saldo a liquidar da obra; quando tudo foi pago, oferece concluir a obra
function SaldoCell({ obra, canComplete }: { obra: Obra; canComplete: boolean }) {
  const balance = getObraBalance(obra);

  if (balance.kind === "concluded") {
    return (
      <div className="min-w-40">
        <p className="inline-flex items-center gap-1 text-sm font-semibold text-success-text">
          <CheckCircle2 size={14} />
          Concluída
        </p>
        <p className="mt-0.5 text-[11px] text-text-muted tabular-nums">
          {obra.dataConclusao ? `em ${formatDate(obra.dataConclusao)} · ` : ""}
          {formatCurrency(obra.valorExecutado)} liquidados
        </p>
      </div>
    );
  }

  if (balance.kind === "paid") {
    return (
      <div className="min-w-40 space-y-1">
        <p className="inline-flex items-center gap-1 text-sm font-semibold text-success-text">
          <CheckCircle2 size={14} />
          Obra paga
        </p>
        <p className="text-[11px] text-text-muted tabular-nums">
          {balance.osQuitadas} OS sem saldo ·{" "}
          {formatCurrency(obra.valorExecutado)}
        </p>
        {canComplete && <CompleteObraButton obra={obra} />}
      </div>
    );
  }

  return (
    <div className="min-w-40" title={`${formatCurrency(obra.valorExecutado)} liquidados de ${formatCurrency(obra.valor)}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">A liquidar</p>
      <p className="text-sm font-bold text-text-primary tabular-nums">{formatCurrency(balance.saldo)}</p>
      {balance.kind !== "empty" && (
        <div className="mt-1 h-1.5 rounded-full bg-surface-muted overflow-hidden">
          <div
            className={`h-full rounded-full ${balance.percent > 100 ? "bg-danger-text" : "bg-primary-500"}`}
            style={{ width: `${Math.min(100, balance.percent)}%` }}
          />
        </div>
      )}
      <p className="mt-1 text-[11px] text-text-muted tabular-nums">
        {balance.kind === "empty"
          ? `Nenhuma nota lançada · ${formatCurrency(obra.valor)}`
          : `${balance.percent}% de ${formatCurrency(obra.valor)}`}
      </p>
    </div>
  );
}

const thClass = "py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase";
const sortableClass = "cursor-pointer hover:text-text-primary transition-colors";

export function ObraTable({ obras, onView, onEdit, onDelete }: ObraTableProps) {
  const { canEditEngenharia } = usePermission();
  const [sortKey, setSortKey] = useState<SortKey>("dataPrevisaoTermino");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(
    () =>
      [...obras].sort((a, b) => {
        let cmp = 0;
        if (sortKey === "nome") cmp = a.nome.localeCompare(b.nome);
        // Coluna Saldo ordena pelo que falta liquidar
        else if (sortKey === "valor") cmp = getObraBalance(a).saldo - getObraBalance(b).saldo;
        else {
          // Obra sem prazo (OS sem datas) vai para o fim
          const da = a.dataPrevisaoTermino ? new Date(a.dataPrevisaoTermino).getTime() : Infinity;
          const db = b.dataPrevisaoTermino ? new Date(b.dataPrevisaoTermino).getTime() : Infinity;
          cmp = da === db ? 0 : da < db ? -1 : 1;
        }
        return sortDir === "asc" ? cmp : -cmp;
      }),
    [obras, sortKey, sortDir],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = useMemo(() => sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE), [sorted, startIndex]);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-muted border-b border-border">
            <tr>
              <th className={`text-left ${thClass} ${sortableClass}`} onClick={() => handleSort("nome")}>
                <div className="flex items-center gap-1">
                  Obra <SortIcon k="nome" sortKey={sortKey} sortDir={sortDir} />
                </div>
              </th>
              <th
                className={`text-left ${thClass} ${sortableClass} hidden lg:table-cell`}
                onClick={() => handleSort("dataPrevisaoTermino")}
              >
                <div className="flex items-center gap-1">
                  Prazo <SortIcon k="dataPrevisaoTermino" sortKey={sortKey} sortDir={sortDir} />
                </div>
              </th>
              <th className={`text-left ${thClass} ${sortableClass}`} onClick={() => handleSort("valor")}>
                <div className="flex items-center gap-1">
                  Saldo <SortIcon k="valor" sortKey={sortKey} sortDir={sortDir} />
                </div>
              </th>
              {canEditEngenharia && <th className={`w-px ${thClass}`} aria-label="Ações" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.map((obra) => {
              const hint = getObraDeadlineHint(obra);
              const origem = getOrigem(obra);
              return (
                <tr
                  key={obra.id}
                  tabIndex={0}
                  onClick={() => onView(obra)}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onView(obra);
                    }
                  }}
                  className={`group cursor-pointer hover:bg-primary-50/40 focus-visible:outline-none focus-visible:bg-primary-50/60 transition-colors ${
                    obra.status === "CANCELADA" ? "opacity-60" : ""
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 text-xs font-semibold shrink-0">
                          {obra.identificacaoPatrimonial}
                        </span>
                        <p className="font-medium text-text-primary text-sm truncate max-w-64" title={obra.nome}>
                          {obra.nome}
                        </p>
                      </div>
                      {/* De onde vem a obra: empenho(s) e OS (número da OS como etiqueta discreta) */}
                      <div
                        className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-text-muted mt-1 max-w-md"
                        title={origem.title}
                      >
                        {origem.empenhos && (
                          <span className="font-medium text-text-secondary tabular-nums">{origem.empenhos}</span>
                        )}
                        {origem.os.slice(0, MAX_OS_TAGS).map((numero) => (
                          <OrdemServicoNumeroTag key={numero} numero={numero} />
                        ))}
                        {origem.os.length > MAX_OS_TAGS && <span>+{origem.os.length - MAX_OS_TAGS}</span>}
                        <span className="hidden sm:inline">· {OBRA_TIPO_LABEL[obra.tipo] ?? obra.tipo}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    {obra.dataPrevisaoTermino ? (
                      <>
                        <p className="text-sm text-text-primary tabular-nums">{formatDateOnly(obra.dataPrevisaoTermino)}</p>
                        {hint && <p className={`text-xs mt-0.5 ${hint.className}`}>{hint.label}</p>}
                      </>
                    ) : (
                      <span className="text-xs text-text-muted">Sem prazo</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <SaldoCell obra={obra} canComplete={canEditEngenharia} />
                  </td>
                  {canEditEngenharia && (
                    <td className="py-3 px-3">
                      {/* Ações discretas: aparecem ao passar o mouse; o clique na linha abre o resumo */}
                      <div
                        className="flex items-center justify-end gap-0.5 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onEdit(obra)}
                          className="p-1.5 cursor-pointer text-text-muted hover:text-primary-500 hover:bg-primary-100 rounded-md transition-colors"
                          title="Editar obra"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => onDelete(obra)}
                          className="p-1.5 cursor-pointer text-text-muted hover:text-danger-text hover:bg-danger-bg rounded-md transition-colors"
                          title="Excluir obra"
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-muted">
          <p className="text-sm text-text-secondary">
            Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, sorted.length)} de {sorted.length} obras
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
}
