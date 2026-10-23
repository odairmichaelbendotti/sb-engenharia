import { ArrowDown, ArrowUp, CheckCircle2, Edit2, Eye, FolderOpen, Map as MapIcon, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { Obra } from "../../../types/obra";
import { formatDate, formatDateOnly } from "../../utils/format-currency";
import { obraStatusDisplay } from "../../utils/status-display";
import { usePermission } from "../../hooks/usePermission";
import { BalanceCell } from "../../components/BalanceCell";
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
import { OBRA_TIPO_LABEL, getObraBalance, getObraDeadlineHint, isObraOverdue } from "./obra-display";
import { CompleteObraDialog } from "./CompleteObraDialog";

const ITEMS_PER_PAGE = 10;

interface ObraTableProps {
  obras: Obra[];
  onView: (obra: Obra) => void;
  onEdit: (obra: Obra) => void;
  onDelete: (obra: Obra) => void;
}

type SortKey = "nome" | "dataPrevisaoTermino" | "valor";
type SortDir = "asc" | "desc";

// Botão de ordenação dentro do cabeçalho da coluna (a seta só aparece na coluna ordenada)
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

const MAX_OS_TAGS = 2;

// Empresas e contratos das OS da obra (normalmente um só)
function getContexto(obra: Obra) {
  const contratos = new Map(obra.ordensServico.map((os) => [os.contrato.id, os.contrato]));
  if (contratos.size === 0 && obra.contrato) contratos.set(obra.contrato.id, obra.contrato);
  const lista = [...contratos.values()];
  return {
    empresa: [...new Set(lista.map((c) => c.company.name))].join(", "),
    contrato: lista.map((c) => c.identificador).join(", "),
  };
}

export function ObraTable({ obras, onView, onEdit, onDelete }: ObraTableProps) {
  const { canEditEngenharia } = usePermission();
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>("dataPrevisaoTermino");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [completing, setCompleting] = useState<Obra | null>(null);

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
          <Th>
            <SortButton label="Obra" k="nome" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
          </Th>
          <Th width="w-36" className="hidden xl:table-cell">
            Status
          </Th>
          <Th width="w-36" className="hidden lg:table-cell">
            <SortButton label="Prazo" k="dataPrevisaoTermino" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
          </Th>
          <Th width="w-52" className="hidden xl:table-cell">
            Empresa · contrato
          </Th>
          <Th width="w-48" className="hidden sm:table-cell">
            <SortButton label="Saldo" k="valor" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
          </Th>
          <Th actions />
        </TableHead>
        <TableBody>
          {paginated.map((obra) => {
            const hint = getObraDeadlineHint(obra);
            const status = obraStatusDisplay(obra.status, isObraOverdue(obra));
            const empenhos = [...new Set(obra.ordensServico.flatMap((os) => os.empenhos.map((v) => v.numero)))];
            const contexto = getContexto(obra);
            const balance = getObraBalance(obra);
            const concluded = balance.kind === "concluded";
            return (
              <Tr key={obra.id} onOpen={() => onView(obra)} muted={obra.status === "CANCELADA"}>
                {/* Identidade: título e, abaixo, patrimônio, OS e empenho de origem */}
                <Td accent={obra.contrato?.cor}>
                  <p className="font-semibold text-text-primary truncate" title={obra.nome}>
                    {obra.nome}
                  </p>
                  <div
                    className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-1 text-[11px] text-text-muted"
                    title={`Empenhos: ${empenhos.join(", ") || "—"}\nOS: ${obra.ordensServico.map((os) => os.numero).join(", ") || "—"}`}
                  >
                    <CodeTag>{obra.identificacaoPatrimonial}</CodeTag>
                    {obra.ordensServico.slice(0, MAX_OS_TAGS).map((os) => (
                      <CodeTag key={os.id}>{/^OS\b/i.test(os.numero) ? os.numero : `OS ${os.numero}`}</CodeTag>
                    ))}
                    {obra.ordensServico.length > MAX_OS_TAGS && <span>+{obra.ordensServico.length - MAX_OS_TAGS}</span>}
                    {empenhos[0] && <span className="font-medium text-text-secondary">{empenhos[0]}</span>}
                    <span className="hidden md:inline">· {OBRA_TIPO_LABEL[obra.tipo] ?? obra.tipo}</span>
                    {/* Em telas sem a coluna de status, o selo aparece aqui */}
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
                  <DateHint
                    date={obra.dataPrevisaoTermino ? formatDateOnly(obra.dataPrevisaoTermino) : null}
                    hint={
                      concluded && obra.dataConclusao
                        ? { label: `concluída em ${formatDate(obra.dataConclusao)}`, tone: "success" }
                        : hint
                          ? { label: hint.label.toLowerCase(), tone: hint.tone }
                          : null
                    }
                  />
                </Td>
                <Td className="hidden xl:table-cell">
                  <p className="truncate text-text-primary" title={contexto.empresa}>
                    {contexto.empresa || "—"}
                  </p>
                  <p className="truncate text-[11px] text-text-muted">{contexto.contrato}</p>
                </Td>
                <Td className="hidden sm:table-cell">
                  <BalanceCell
                    valor={obra.valor}
                    liquidado={obra.valorExecutado}
                    paidLabel={concluded ? "Concluída" : "Obra paga"}
                    inactive={obra.status === "CANCELADA"}
                  />
                </Td>
                <Td actions>
                  <ActionMenu
                    label={`Ações da obra ${obra.identificacaoPatrimonial}`}
                    items={[
                      { label: "Visualizar", icon: Eye, onClick: () => onView(obra) },
                      { label: "Editar", icon: Edit2, onClick: () => onEdit(obra), hidden: !canEditEngenharia },
                      {
                        label: "Concluir obra",
                        icon: CheckCircle2,
                        onClick: () => setCompleting(obra),
                        hidden: !canEditEngenharia || balance.kind !== "paid",
                      },
                      {
                        label: "Ver no mapa",
                        icon: MapIcon,
                        onClick: () => navigate(`/mapa-obras?obra=${obra.id}`),
                        hidden: obra.latitude == null || obra.longitude == null,
                      },
                      { label: "Excluir", icon: Trash2, onClick: () => onDelete(obra), danger: true, hidden: !canEditEngenharia },
                    ]}
                  />
                </Td>
              </Tr>
            );
          })}
        </TableBody>
      </Table>

      {paginated.length === 0 && (
        <div className="py-10 text-center">
          <FolderOpen size={28} className="mx-auto text-text-muted mb-2" />
          <p className="text-sm text-text-secondary">Nenhuma obra encontrada</p>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        totalItems={sorted.length}
        itemsPerPage={ITEMS_PER_PAGE}
        itemLabel="obras"
        onPageChange={setPage}
      />

      {completing && <CompleteObraDialog obra={completing} open onClose={() => setCompleting(null)} />}
    </div>
  );
}
