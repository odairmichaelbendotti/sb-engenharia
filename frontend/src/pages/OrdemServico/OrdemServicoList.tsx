import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Edit2,
  Eye,
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
import { OrdemServicoNumeroTag } from "../../components/OrdemServicoNumeroTag";
import { Badge, Button, IconButton, Pagination } from "../../components/ui";
import { FinalizeOrdemServicoButton } from "./FinalizeOrdemServico";
import { getOrdemServicoBalance, isQuitada } from "./ordem-servico-balance";
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
        <Loader2 size={32} className="mx-auto text-text-muted animate-spin mb-3" />
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
          <Button icon={Plus} onClick={onAdd} className="mt-4">
            Cadastrar ordem de serviço
          </Button>
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        totalItems={ordensServico.length}
        itemsPerPage={ITEMS_PER_PAGE}
        itemLabel="ordens de serviço"
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
  const muted = os.status !== "ATIVO";
  // O título é o serviço (nome da obra); sem obra, a descrição do empenho
  const title = os.obra?.nome ?? os.empenho.description;

  return (
    <li
      role="button"
      tabIndex={0}
      aria-label={`Visualizar ordem de serviço ${os.numero}: ${title}`}
      onClick={() => onView(os)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView(os);
        }
      }}
      className="group relative grid grid-cols-1 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)_minmax(0,1fr)_2.5rem] gap-x-6 gap-y-3 pl-5 pr-3 py-4 cursor-pointer transition-colors hover:bg-surface-muted/60 focus-visible:outline-none focus-visible:bg-surface-muted"
    >
      {/* Faixa na cor do contrato: agrupa visualmente OS do mesmo contrato */}
      <span
        aria-hidden
        className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
        style={{ backgroundColor: contrato.cor }}
      />

      {/* Serviço: o número da OS é só uma etiqueta, o título diz o que está sendo feito */}
      <div className={`min-w-0 pr-8 md:pr-0 ${muted ? "opacity-60" : ""}`}>
        <p
          className={`text-table leading-snug line-clamp-2 ${
            os.obra ? "font-semibold text-text-primary" : "font-medium text-text-secondary"
          }`}
          title={title}
        >
          {title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary min-w-0">
          <OrdemServicoNumeroTag numero={os.numero} />
          {/* Ativa é o padrão: o status só aparece quando é outro */}
          {os.status !== "ATIVO" && (
            <Badge>{STATUS_LABEL[os.status]}</Badge>
          )}
          <span className="truncate" title={`${contrato.company.name} · ${contrato.identificador}`}>
            {contrato.company.name} <span className="text-text-muted">·</span> {contrato.identificador}
          </span>
          {!os.obra && <span className="text-text-muted">· sem obra vinculada</span>}
        </div>
      </div>

      {/* Prazo da própria OS: aparece mesmo antes de ela ter obra. Coluna do meio: centralizada, como nas tabelas */}
      <div className={`min-w-0 md:text-center ${muted ? "opacity-60" : ""}`}>
        {os.dataInicio && os.dataPrevisaoTermino ? (
          <ScheduleTimeline start={os.dataInicio} end={os.dataPrevisaoTermino} schedule={schedule} />
        ) : (
          <ScheduleChip schedule={schedule} />
        )}
      </div>

      {/* Saldo a liquidar (vem das NFs da OS) */}
      <div className="min-w-0">
        <BalanceCell ordemServico={os} muted={muted} canFinalize={canEdit} />
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
            className="hidden md:block text-text-muted group-hover:text-text-primary transition-colors"
          />
        )}
      </div>
    </li>
  );
}

// Situação do prazo em texto discreto (sem fundo): a cor fica só no texto e no ícone
const SCHEDULE_TEXT: Record<ScheduleTone, string> = {
  neutral: "text-text-muted",
  success: "text-success-text",
  warning: "text-warning-text",
  danger: "text-danger-text",
};

function ScheduleChip({ schedule }: { schedule: OrdemServicoSchedule }) {
  const Icon = SCHEDULE_ICON[schedule.kind];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium whitespace-nowrap ${SCHEDULE_TEXT[schedule.tone]}`}
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
    <div className="md:mt-1 space-y-1.5">
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

function BalanceCell({
  ordemServico: os,
  muted,
  canFinalize,
}: {
  ordemServico: OrdemServico;
  muted: boolean;
  canFinalize: boolean;
}) {
  const balance = getOrdemServicoBalance(os);
  const closed = balance.kind === "paid" || balance.kind === "over";

  return (
    // Coluna do meio da grade: centralizada no desktop, como nas tabelas; no celular segue à esquerda
    <div className="flex flex-col items-start md:items-center gap-1 md:text-center">
      {/* O detalhe (% liquidado do valor) fica no modal da OS; aqui só como dica ao passar o mouse */}
      <div
        className={`flex flex-col items-start md:items-center gap-1 w-full ${muted ? "opacity-60" : ""}`}
        title={
          balance.kind === "empty"
            ? `Nenhuma nota lançada · ${formatCurrency(os.valor)}`
            : `${balance.percent}% liquidado de ${formatCurrency(os.valor)}`
        }
      >
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          {closed ? "Saldo" : "A liquidar"}
        </span>
        {balance.kind === "paid" ? (
          <span className="inline-flex items-center gap-1 text-table font-semibold text-success-text">
            <CheckCircle2 size={14} />
            {os.status === "ATIVO" ? "Quitada · sem saldo" : "Quitada"}
          </span>
        ) : balance.kind === "over" ? (
          <span className="inline-flex items-center gap-1 text-table font-semibold text-danger-text tabular-nums">
            <AlertTriangle size={14} />
            {formatCurrency(balance.excesso)} acima do valor
          </span>
        ) : (
          <span className="text-sm font-bold text-text-primary tabular-nums tracking-tight">
            {formatCurrency(balance.saldo)}
          </span>
        )}
        {balance.kind !== "empty" && (
          <div
            className="h-1.5 w-full md:max-w-48 rounded-full bg-surface-muted overflow-hidden"
            role="img"
            aria-label={`${balance.percent}% liquidado`}
          >
            <div
              className={`h-full rounded-full ${
                balance.kind === "over" ? "bg-danger-text" : balance.kind === "paid" ? "bg-secondary-500" : "bg-primary-500"
              }`}
              style={{ width: `${Math.min(100, balance.percent)}%` }}
            />
          </div>
        )}
      </div>
      {canFinalize && isQuitada(os) && (
        <div className="mt-1">
          <FinalizeOrdemServicoButton ordemServico={os} />
        </div>
      )}
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
      <IconButton
        icon={MoreHorizontal}
        label="Ações"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={open ? "bg-surface-muted" : undefined}
      />
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
      type="button"
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
