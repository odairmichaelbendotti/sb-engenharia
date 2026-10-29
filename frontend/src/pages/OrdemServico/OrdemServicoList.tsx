import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  ClipboardList,
  Clock,
  Edit2,
  Eye,
  FileDown,
  Loader2,
  PauseCircle,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { OrdemServico } from "../../../types/ordem-servico";
import { usePermission } from "../../hooks/usePermission";
import { useOrdensServico } from "../../store/ordensServico";
import { formatDateOnly } from "../../utils/format-currency";
import { downloadBlob, toFilename } from "../../utils/download-file";
import { cx } from "../../utils/cx";
import { BalanceCell } from "../../components/BalanceCell";
import {
  ActionMenu,
  Button,
  CodeTag,
  Pagination,
  StatusPill,
  Table,
  TableBody,
  TableHead,
  Td,
  Th,
  Tr,
} from "../../components/ui";
import { OrcamentoTag } from "./OrcamentoTag";
import { abrirOrcamento } from "./orcamento-link";
import { FinalizeOrdemServicoDialog } from "./FinalizeOrdemServico";
import { isQuitada } from "./ordem-servico-balance";
import { ordemServicoStatusDisplay } from "./ordem-servico-display";
import { getOrdemServicoSchedule, type OrdemServicoSchedule, type ScheduleKind, type ScheduleTone } from "./ordem-servico-schedule";

const ITEMS_PER_PAGE = 10;

const TONE_FILL: Record<ScheduleTone, string> = {
  danger: "bg-danger-dot",
  warning: "bg-warning-dot",
  success: "bg-progress",
  neutral: "bg-border-strong",
};

// Dica do prazo: no prazo fica em cinza; só atraso e vencimento próximo ganham cor
const SCHEDULE_TEXT: Record<ScheduleTone, string> = {
  neutral: "text-text-muted",
  success: "text-text-muted",
  warning: "text-warning-text font-semibold",
  danger: "text-danger-text font-semibold",
};

const SCHEDULE_ICON: Record<ScheduleKind, LucideIcon> = {
  overdue: AlertTriangle,
  dueSoon: Clock,
  paused: PauseCircle,
  noObra: AlertTriangle,
  noSchedule: AlertTriangle,
  onTrack: Clock,
  concluded: CheckCircle2,
  inactive: Clock,
};

interface OrdemServicoListProps {
  ordensServico: OrdemServico[];
  isLoading?: boolean;
  onView: (ordemServico: OrdemServico) => void;
  onEdit: (ordemServico: OrdemServico) => void;
  onDelete: (ordemServico: OrdemServico) => void;
  onAdd?: () => void;
}

export function OrdemServicoList({ ordensServico, isLoading = false, onView, onEdit, onDelete, onAdd }: OrdemServicoListProps) {
  const { canEditAdministrativo, canCreateOrdemServico, canViewEngenharia, isEmpresaRestricted } = usePermission();
  const fetchOrdemServicoDocument = useOrdensServico((s) => s.fetchOrdemServicoDocument);
  const [page, setPage] = useState(1);
  const [finalizing, setFinalizing] = useState<OrdemServico | null>(null);

  const totalPages = Math.max(1, Math.ceil(ordensServico.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = useMemo(() => ordensServico.slice(startIndex, startIndex + ITEMS_PER_PAGE), [ordensServico, startIndex]);

  async function downloadPdf(os: OrdemServico) {
    try {
      const blob = await fetchOrdemServicoDocument(os.id);
      downloadBlob(blob, `${toFilename(os.numero)}.pdf`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar o documento da ordem de serviço");
    }
  }

  return (
    <div>
      <Table>
        <TableHead>
          <Th>Serviço</Th>
          <Th width="w-40" className="hidden xl:table-cell">
            Status
          </Th>
          <Th width="w-60" className="hidden lg:table-cell">
            Prazo
          </Th>
          <Th width="w-48" className="hidden sm:table-cell">
            Saldo
          </Th>
          <Th actions />
        </TableHead>
        <TableBody>
          {paginated.map((os) => {
            const schedule = getOrdemServicoSchedule(os);
            const status = ordemServicoStatusDisplay(os);
            const { contrato } = os.empenho;
            // O título é o serviço (nome da obra); sem obra, a descrição do empenho
            const title = os.obra?.nome ?? os.empenho.description;
            return (
              <Tr key={os.id} onOpen={() => onView(os)} muted={os.status !== "ATIVO"}>
                <Td accent={contrato.cor}>
                  <p
                    className={cx("truncate", os.obra ? "font-semibold text-text-primary" : "font-medium text-text-secondary")}
                    title={title}
                  >
                    {title}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-1 text-[11px] text-text-muted min-w-0">
                    <CodeTag>{/^OS\b/i.test(os.numero) ? os.numero : `OS ${os.numero}`}</CodeTag>
                    {os.obra && <CodeTag>{os.obra.identificacaoPatrimonial}</CodeTag>}
                    <span className="truncate" title={`${contrato.company.name} · ${contrato.identificador}`}>
                      {contrato.company.name} · {contrato.identificador}
                    </span>
                    {/* Pendência interna (criar a obra): o login da empresa não vê */}
                    {!os.obra && os.status === "ATIVO" && !isEmpresaRestricted && (
                      <span className="text-warning-text font-semibold">sem obra</span>
                    )}
                    <OrcamentoTag ordemServicoId={os.id} temOrcamento={os.temOrcamento} />
                    {os.contestacoesAbertas > 0 && (
                      <span className="text-warning-text font-semibold">
                        {os.contestacoesAbertas} {os.contestacoesAbertas === 1 ? "apontamento" : "apontamentos"}
                      </span>
                    )}
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
                  {os.dataInicio && os.dataPrevisaoTermino ? (
                    <ScheduleTimeline start={os.dataInicio} end={os.dataPrevisaoTermino} schedule={schedule} />
                  ) : (
                    <ScheduleChip schedule={schedule} />
                  )}
                </Td>
                <Td className="hidden sm:table-cell">
                  <BalanceCell
                    valor={os.valor}
                    liquidado={os.valorExecutado}
                    paidLabel="Quitada"
                    inactive={os.status === "CANCELADO"}
                  />
                </Td>
                <Td actions>
                  <ActionMenu
                    label={`Ações da OS ${os.numero}`}
                    items={[
                      { label: "Visualizar", icon: Eye, onClick: () => onView(os) },
                      { label: "Editar", icon: Edit2, onClick: () => onEdit(os), hidden: !canEditAdministrativo },
                      {
                        label: "Abrir orçamento",
                        icon: Calculator,
                        onClick: () => abrirOrcamento(os.id),
                        hidden: !os.temOrcamento || !canViewEngenharia,
                      },
                      { label: "Baixar PDF", icon: FileDown, onClick: () => void downloadPdf(os) },
                      {
                        label: "Finalizar OS",
                        icon: CheckCircle2,
                        onClick: () => setFinalizing(os),
                        hidden: !canEditAdministrativo || !isQuitada(os),
                      },
                      {
                        label: "Excluir",
                        icon: Trash2,
                        onClick: () => onDelete(os),
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

      {paginated.length === 0 &&
        (isLoading ? (
          <div className="py-10 text-center">
            <Loader2 size={28} className="mx-auto text-text-muted animate-spin mb-2" />
            <p className="text-text-secondary text-sm">Carregando ordens de serviço...</p>
          </div>
        ) : (
          <div className="py-10 text-center">
            <ClipboardList size={28} className="mx-auto text-text-muted mb-2" />
            <p className="text-sm text-text-secondary font-medium">Nenhuma ordem de serviço encontrada</p>
            <p className="text-text-muted text-xs mt-1">Tente ajustar os filtros ou cadastre uma nova ordem de serviço</p>
            {onAdd && canCreateOrdemServico && (
              <Button icon={Plus} onClick={onAdd} className="mt-4">
                Cadastrar ordem de serviço
              </Button>
            )}
          </div>
        ))}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        totalItems={ordensServico.length}
        itemsPerPage={ITEMS_PER_PAGE}
        itemLabel="ordens de serviço"
        onPageChange={setPage}
      />

      {finalizing && <FinalizeOrdemServicoDialog ordemServico={finalizing} open onClose={() => setFinalizing(null)} />}
    </div>
  );
}

function ScheduleChip({ schedule }: { schedule: OrdemServicoSchedule }) {
  const Icon = SCHEDULE_ICON[schedule.kind];
  return (
    <span
      className={cx("inline-flex items-center gap-1 text-[11px] whitespace-nowrap", SCHEDULE_TEXT[schedule.tone])}
      title={
        schedule.kind === "noObra"
          ? "Vincule esta OS a uma obra (no cadastro da OS ou da obra)"
          : schedule.kind === "noSchedule"
            ? "Edite a OS e informe o início e a previsão de término"
            : undefined
      }
    >
      <Icon size={12} className="shrink-0" />
      {schedule.label}
    </span>
  );
}

// Linha do tempo do prazo: início, fim, marcador de hoje e a dica abaixo
function ScheduleTimeline({ start, end, schedule }: { start: string; end: string; schedule: OrdemServicoSchedule }) {
  const percent = Math.round((schedule.elapsedRatio ?? 0) * 100);
  const showToday = schedule.kind !== "concluded" && schedule.kind !== "inactive";

  return (
    <div className="w-52 max-w-full space-y-1">
      <div className="flex items-center gap-2 text-[11px] text-text-muted tabular-nums">
        <span>{formatDateOnly(start)}</span>
        <div className="relative flex-1 h-1.25 rounded-full bg-surface-muted" role="img" aria-label={`${percent}% do prazo decorrido`}>
          <div className={cx("absolute inset-y-0 left-0 rounded-full", TONE_FILL[schedule.tone])} style={{ width: `${percent}%` }} />
          {showToday && (
            <span
              className={cx(
                "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-surface",
                TONE_FILL[schedule.tone],
              )}
              style={{ left: `${percent}%` }}
              title="Hoje"
            />
          )}
        </div>
        <span>{formatDateOnly(end)}</span>
      </div>
      <ScheduleChip schedule={schedule} />
    </div>
  );
}
