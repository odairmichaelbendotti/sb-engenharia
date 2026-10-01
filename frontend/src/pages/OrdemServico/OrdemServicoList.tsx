import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Edit2,
  Eye,
  HardHat,
  Loader2,
  MoreHorizontal,
  PauseCircle,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import type { OrdemServico } from "../../../types/ordem-servico";
import { usePermission } from "../../hooks/usePermission";
import { formatCurrency, formatDateOnly } from "../../utils/format-currency";
import { OrdemServicoPagination } from "./OrdemServicoPagination";
import {
  getOrdemServicoSchedule,
  type OrdemServicoSchedule,
  type ScheduleKind,
  type ScheduleTone,
} from "./ordem-servico-schedule";

const ITEMS_PER_PAGE = 10;

const STATUS_LABEL: Record<OrdemServico["status"], string> = {
  ATIVO: "Ativa",
  FINALIZADO: "Finalizada",
  CANCELADO: "Cancelada",
};

const STATUS_DOT: Record<OrdemServico["status"], string> = {
  ATIVO: "bg-warning-text",
  FINALIZADO: "bg-success-text",
  CANCELADO: "bg-danger-text",
};

const TONE_CHIP: Record<ScheduleTone, string> = {
  danger: "bg-danger-bg text-danger-text border-danger-border",
  warning: "bg-warning-bg text-warning-text border-warning-border",
  success: "bg-success-bg text-success-text border-success-border",
  neutral: "bg-surface-muted text-text-secondary border-border",
};

const TONE_FILL: Record<ScheduleTone, string> = {
  danger: "bg-danger-text",
  warning: "bg-accent-400",
  success: "bg-secondary-400",
  neutral: "bg-border-strong",
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

export function OrdemServicoList({
  ordensServico,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
  onAdd,
}: OrdemServicoListProps) {
  const { canEditAdministrativo, canCreateOrdemServico } = usePermission();
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(ordensServico.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = useMemo(
    () => ordensServico.slice(startIndex, startIndex + ITEMS_PER_PAGE),
    [ordensServico, startIndex],
  );

  if (paginated.length === 0) {
    return isLoading ? (
      <div className="py-12 text-center">
        <Loader2 size={32} className="mx-auto text-primary-500 animate-spin mb-3" />
        <p className="text-text-secondary text-sm">Carregando ordens de serviço...</p>
      </div>
    ) : (
      <div className="py-12 text-center">
        <ClipboardList size={32} className="mx-auto text-text-muted mb-3" />
        <p className="text-text-secondary font-medium">Nenhuma ordem de serviço encontrada</p>
        <p className="text-text-muted text-sm mt-1">
          Tente ajustar os filtros ou cadastre uma nova ordem de serviço
        </p>
        {onAdd && canCreateOrdemServico && (
          <button
            onClick={onAdd}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-md cursor-pointer transition-colors"
          >
            <Plus size={16} />
            Cadastrar ordem de serviço
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <ul className="divide-y divide-border">
        {paginated.map((os) => (
          <OrdemServicoRow
            key={os.id}
            ordemServico={os}
            canEdit={canEditAdministrativo}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </ul>

      <OrdemServicoPagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        totalItems={ordensServico.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setPage}
      />
    </div>
  );
}

interface OrdemServicoRowProps {
  ordemServico: OrdemServico;
  canEdit: boolean;
  onView: (ordemServico: OrdemServico) => void;
  onEdit: (ordemServico: OrdemServico) => void;
  onDelete: (ordemServico: OrdemServico) => void;
}

function OrdemServicoRow({ ordemServico: os, canEdit, onView, onEdit, onDelete }: OrdemServicoRowProps) {
  const schedule = getOrdemServicoSchedule(os);
  const { contrato } = os.empenho;
  const muted = os.status === "CANCELADO";

  return (
    <li
      role="button"
      tabIndex={0}
      aria-label={`Visualizar ordem de serviço ${os.numero}`}
      onClick={() => onView(os)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView(os);
        }
      }}
      className="group relative grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,0.85fr)_2.5rem] gap-x-6 gap-y-3 pl-5 pr-3 py-4 cursor-pointer transition-colors hover:bg-primary-50/40 focus-visible:outline-none focus-visible:bg-primary-50/60"
    >
      {/* Faixa na cor do contrato: agrupa visualmente OS do mesmo contrato */}
      <span
        aria-hidden
        className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
        style={{ backgroundColor: contrato.cor }}
      />

      {/* Identificação */}
      <div className={`min-w-0 pr-8 md:pr-0 ${muted ? "opacity-60" : ""}`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-semibold text-text-primary tracking-tight">{os.numero}</span>
          <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[os.status]}`} />
            {STATUS_LABEL[os.status]}
          </span>
        </div>
        <p className="text-sm text-text-secondary truncate mt-0.5" title={`${contrato.identificador} · ${contrato.company.name}`}>
          {contrato.identificador} <span className="text-text-muted">·</span> {contrato.company.name}
        </p>
      </div>

      {/* Obra e prazo */}
      <div className={`min-w-0 ${muted ? "opacity-60" : ""}`}>
        {os.obra && (
          <p className="flex items-center gap-1.5 text-sm text-text-primary min-w-0">
            <HardHat size={14} className="text-text-muted shrink-0" />
            <span className="truncate" title={os.obra.nome}>
              {os.obra.nome}
            </span>
          </p>
        )}
        {/* Prazo é da própria OS: aparece mesmo antes de ela ter obra */}
        {os.dataInicio && os.dataPrevisaoTermino ? (
          <ScheduleTimeline start={os.dataInicio} end={os.dataPrevisaoTermino} schedule={schedule} />
        ) : (
          <ScheduleChip schedule={schedule} />
        )}
      </div>

      {/* Valor e execução */}
      <div className={`min-w-0 md:text-right ${muted ? "opacity-60" : ""}`}>
        <p className="text-base font-semibold text-text-primary tabular-nums">{formatCurrency(os.valor)}</p>
        {os.empenhos.length > 1 && (
          <p className="text-xs text-text-muted" title={os.empenhos.map((v) => v.numero).join(", ")}>
            {os.empenhos.length} empenhos
          </p>
        )}
        {os.obra && <ExecutionBar executed={os.valorExecutado} total={os.valor} />}
      </div>

      {/* Ações */}
      <div className="absolute top-3 right-3 md:static flex md:items-center md:justify-end">
        {canEdit ? (
          <RowActionsMenu
            onView={() => onView(os)}
            onEdit={() => onEdit(os)}
            onDelete={() => onDelete(os)}
          />
        ) : (
          <ChevronRight
            size={18}
            className="hidden md:block text-text-muted group-hover:text-primary-500 transition-colors"
          />
        )}
      </div>
    </li>
  );
}

function ScheduleChip({ schedule }: { schedule: OrdemServicoSchedule }) {
  const Icon = SCHEDULE_ICON[schedule.kind];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium whitespace-nowrap ${TONE_CHIP[schedule.tone]}`}
      title={
        schedule.kind === "noObra"
          ? "Vincule esta OS a uma obra (no cadastro da OS ou da obra)"
          : schedule.kind === "noSchedule"
            ? "Edite a OS e informe o início e a previsão de término"
            : undefined
      }
    >
      <Icon size={12} />
      {schedule.label}
    </span>
  );
}

function ScheduleTimeline({
  start,
  end,
  schedule,
}: {
  start: string;
  end: string;
  schedule: OrdemServicoSchedule;
}) {
  const percent = Math.round((schedule.elapsedRatio ?? 0) * 100);
  const showToday = schedule.kind !== "concluded" && schedule.kind !== "inactive";

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-2 text-[11px] text-text-muted tabular-nums">
        <span>{formatDateOnly(start)}</span>
        <div
          className="relative flex-1 h-1.5 rounded-full bg-surface-muted"
          role="img"
          aria-label={`${percent}% do prazo decorrido`}
        >
          <div
            className={`absolute inset-y-0 left-0 rounded-full ${TONE_FILL[schedule.tone]}`}
            style={{ width: `${percent}%` }}
          />
          {showToday && (
            <span
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-surface ${TONE_FILL[schedule.tone]}`}
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

function ExecutionBar({ executed, total }: { executed: number; total: number }) {
  const percent = total > 0 ? Math.round((executed / total) * 100) : 0;
  const over = percent > 100;

  return (
    <div className="mt-2 md:ml-auto md:max-w-44" title={`${formatCurrency(executed)} liquidados em notas fiscais`}>
      <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
        <span>Liquidado</span>
        <span className={`font-semibold tabular-nums ${over ? "text-danger-text" : "text-text-secondary"}`}>
          {percent}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${over ? "bg-danger-text" : "bg-primary-500"}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
}

function RowActionsMenu({
  onView,
  onEdit,
  onDelete,
}: {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Cliques no menu não podem abrir o modal de visualização da linha
  const run = (action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    action();
  };

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Ações"
        className={`p-1.5 rounded-md cursor-pointer transition-colors text-text-muted hover:text-text-primary hover:bg-surface-muted ${
          open ? "bg-surface-muted text-text-primary" : ""
        }`}
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-20 w-40 rounded-lg border border-border bg-surface shadow-lg py-1"
        >
          <MenuItem icon={Eye} label="Visualizar" onClick={run(onView)} />
          <MenuItem icon={Edit2} label="Editar" onClick={run(onEdit)} />
          <div className="my-1 border-t border-border" />
          <MenuItem icon={Trash2} label="Excluir" onClick={run(onDelete)} danger />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: {
  icon: LucideIcon;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  danger?: boolean;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer transition-colors ${
        danger ? "text-danger-text hover:bg-danger-bg" : "text-text-primary hover:bg-surface-muted"
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
