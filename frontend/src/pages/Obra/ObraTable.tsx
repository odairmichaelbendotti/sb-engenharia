import { Trash2, Edit2, ArrowUp, ArrowDown, CheckCircle2 } from "lucide-react";
import { IconButton, Pagination, Table, TableBody, TableHead, Td, Th, Tr } from "../../components/ui";
import { useMemo, useState } from "react";
import type { Obra } from "../../../types/obra";
import { formatCurrency, formatDate, formatDateOnly } from "../../utils/format-currency";
import { cx } from "../../utils/cx";
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
    <ArrowUp size={12} className="text-text-primary" />
  ) : (
    <ArrowDown size={12} className="text-text-primary" />
  );
}

// Botão de ordenação dentro do cabeçalho da coluna
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
  return (
    <button
      type="button"
      onClick={() => onSort(k)}
      className="inline-flex items-center gap-1 cursor-pointer hover:text-text-primary transition-colors"
    >
      {label} <SortIcon k={k} sortKey={sortKey} sortDir={sortDir} />
    </button>
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

// Empresas das OS da obra (normalmente uma só; mais de uma quando há OS de contratos diferentes)
function getEmpresas(obra: Obra) {
  const nomes = obra.ordensServico.map((os) => os.contrato.company.name);
  if (nomes.length === 0 && obra.contrato) nomes.push(obra.contrato.company.name);
  return [...new Set(nomes)].join(", ");
}

// Saldo a liquidar da obra; quando tudo foi pago, oferece concluir a obra.
// O alinhamento vem da coluna da tabela (centro ou direita, conforme a posição)
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
        {canComplete && (
          // Bloco em linha: o botão (e a confirmação) segue o alinhamento da coluna
          <div>
            <div className="inline-block">
              <CompleteObraButton obra={obra} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="min-w-40"
      title={`${formatCurrency(obra.valorExecutado)} liquidados de ${formatCurrency(obra.valor)}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">A liquidar</p>
      <p className="text-sm font-semibold text-text-primary tabular-nums">{formatCurrency(balance.saldo)}</p>
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
      <Table>
        <TableHead>
          <Th wrap>
            <SortButton label="Obra" k="nome" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
          </Th>
          <Th className="hidden lg:table-cell">
            <SortButton
              label="Prazo"
              k="dataPrevisaoTermino"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />
          </Th>
          <Th className="hidden md:table-cell">Empresa</Th>
          <Th>
            <SortButton label="Saldo" k="valor" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
          </Th>
          {canEditEngenharia && (
            <Th>
              <span className="sr-only">Ações</span>
            </Th>
          )}
        </TableHead>
        <TableBody>
          {paginated.map((obra) => {
            const hint = getObraDeadlineHint(obra);
            const origem = getOrigem(obra);
            const empresas = getEmpresas(obra);
            return (
              <Tr
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
                className={cx(
                  "group focus-visible:outline-none focus-visible:bg-surface-muted",
                  obra.status === "CANCELADA" && "opacity-60",
                )}
              >
                {/* Nome longo quebra em até duas linhas; nome completo ao passar o mouse */}
                <Td wrap>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded-md bg-surface-muted border border-border text-text-primary text-xs font-semibold shrink-0">
                      {obra.identificacaoPatrimonial}
                    </span>
                    <p className="font-medium text-text-primary line-clamp-2" title={obra.nome}>
                      {obra.nome}
                    </p>
                  </div>
                  {/* De onde vem a obra: empenho(s) e OS (número da OS como etiqueta discreta) */}
                  <div
                    className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-text-muted mt-1"
                    title={origem.title}
                  >
                    {origem.empenhos && (
                      <span className="font-medium text-text-secondary">{origem.empenhos}</span>
                    )}
                    {origem.os.slice(0, MAX_OS_TAGS).map((numero) => (
                      <OrdemServicoNumeroTag key={numero} numero={numero} />
                    ))}
                    {origem.os.length > MAX_OS_TAGS && <span>+{origem.os.length - MAX_OS_TAGS}</span>}
                    <span className="hidden sm:inline">· {OBRA_TIPO_LABEL[obra.tipo] ?? obra.tipo}</span>
                  </div>
                </Td>
                <Td className="hidden lg:table-cell">
                  {obra.dataPrevisaoTermino ? (
                    <>
                      <p className="text-text-primary">{formatDateOnly(obra.dataPrevisaoTermino)}</p>
                      {hint && <p className={`text-xs mt-0.5 ${hint.className}`}>{hint.label}</p>}
                    </>
                  ) : (
                    <span className="text-xs text-text-muted">Sem prazo</span>
                  )}
                </Td>
                {/* Uma linha só: nome longo termina em reticências e aparece inteiro ao passar o mouse */}
                <Td className="hidden md:table-cell">
                  <p className="max-w-56 truncate text-text-secondary" title={empresas}>
                    {empresas || "—"}
                  </p>
                </Td>
                <Td>
                  <SaldoCell obra={obra} canComplete={canEditEngenharia} />
                </Td>
                {canEditEngenharia && (
                  <Td>
                    {/* Ações discretas: aparecem ao passar o mouse; o clique na linha abre o resumo */}
                    <div
                      className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconButton icon={Edit2} label="Editar obra" size="sm" onClick={() => onEdit(obra)} />
                      <IconButton
                        icon={Trash2}
                        label="Excluir obra"
                        variant="danger"
                        size="sm"
                        onClick={() => onDelete(obra)}
                      />
                    </div>
                  </Td>
                )}
              </Tr>
            );
          })}
        </TableBody>
      </Table>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        totalItems={sorted.length}
        itemsPerPage={ITEMS_PER_PAGE}
        itemLabel="obras"
        onPageChange={setPage}
      />
    </div>
  );
}
