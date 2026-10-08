import { useEffect } from "react";
import {
  X,
  HardHat,
  Edit2,
  ClipboardList,
  UserCog,
  Building2,
  MapPin,
  AlignLeft,
  StickyNote,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PauseCircle,
  type LucideIcon,
} from "lucide-react";
import type { Obra, ObraOrdemServico } from "../../../types/obra";
import type { OrdemServicoStatus } from "../../../types/ordem-servico";
import { formatCurrency, formatDateOnly, formatDate } from "../../utils/format-currency";
import { usePermission } from "../../hooks/usePermission";
import {
  getOrdemServicoSchedule,
  type OrdemServicoSchedule,
  type ScheduleKind,
  type ScheduleTone,
} from "../OrdemServico/ordem-servico-schedule";
import { OBRA_STATUS, OBRA_TIPO_LABEL, getObraBalance, getObraDeadlineHint } from "./obra-display";
import { getBalance } from "../OrdemServico/ordem-servico-balance";
import { CompleteObraButton } from "./CompleteObraButton";

interface ViewObraModalProps {
  obra: Obra;
  onEdit?: (obra: Obra) => void;
  handleClose: () => void;
}

const OS_STATUS: Record<string, { label: string; className: string }> = {
  ATIVO: { label: "Ativa", className: "bg-warning-bg text-warning-text border-warning-border" },
  FINALIZADO: { label: "Finalizada", className: "bg-success-bg text-success-text border-success-border" },
  CANCELADO: { label: "Cancelada", className: "bg-surface-muted text-text-secondary border-border" },
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

function percentOf(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function SummaryTile({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface-muted px-3.5 py-3 min-w-0">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-base font-semibold text-text-primary mt-0.5 tabular-nums truncate">{value}</p>
      {children}
    </div>
  );
}

function Detail({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <Icon size={14} className="text-text-muted mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-text-muted leading-none">{label}</p>
        <div className="text-sm text-text-primary mt-1 wrap-break-word">{children}</div>
      </div>
    </div>
  );
}

function ProgressBar({ percent, className }: { percent: number; className: string }) {
  return (
    <div className="h-1.5 rounded-full bg-border/60 overflow-hidden">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
  );
}

function ScheduleChip({ schedule }: { schedule: OrdemServicoSchedule }) {
  const Icon = SCHEDULE_ICON[schedule.kind];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium whitespace-nowrap ${TONE_CHIP[schedule.tone]}`}
    >
      <Icon size={12} />
      {schedule.label}
    </span>
  );
}

function OrdemServicoCard({ os, obra }: { os: ObraOrdemServico; obra: Obra }) {
  const schedule = getOrdemServicoSchedule({
    status: os.status as OrdemServicoStatus,
    dataInicio: os.dataInicio,
    dataPrevisaoTermino: os.dataPrevisaoTermino,
    obra: { status: obra.status, dataConclusao: obra.dataConclusao ?? null },
  });
  const status = OS_STATUS[os.status] ?? OS_STATUS.CANCELADO!;
  const elapsed = Math.round((schedule.elapsedRatio ?? 0) * 100);
  const executado = percentOf(os.valorExecutado, os.valor);
  const showToday = schedule.kind !== "concluded" && schedule.kind !== "inactive";

  return (
    <li className="relative rounded-lg border border-border bg-surface pl-4 pr-3.5 py-3 overflow-hidden">
      {/* Faixa na cor do contrato, como na lista de OS */}
      <span aria-hidden className="absolute left-0 inset-y-0 w-1" style={{ backgroundColor: os.contrato.cor }} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-text-primary">OS {os.numero}</span>
            <span className={`px-1.5 py-0.5 rounded-full border text-[11px] font-medium ${status.className}`}>
              {status.label}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5 truncate">
            {os.contrato.identificador} · {os.contrato.company.name}
            {os.empenhos.length > 0 && <> · {os.empenhos.map((e) => e.numero).join(", ")}</>}
          </p>
        </div>
        <p className="text-sm font-semibold text-text-primary tabular-nums shrink-0">{formatCurrency(os.valor)}</p>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
        {/* Prazo de execução da OS */}
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-text-muted">Prazo</span>
            <ScheduleChip schedule={schedule} />
          </div>
          {os.dataInicio && os.dataPrevisaoTermino ? (
            <>
              <div className="mt-2 relative">
                <ProgressBar percent={elapsed} className={TONE_FILL[schedule.tone]} />
                {showToday && (
                  <span
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-surface ${TONE_FILL[schedule.tone]}`}
                    style={{ left: `${elapsed}%` }}
                    title="Hoje"
                  />
                )}
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-text-muted tabular-nums">
                <span>Início {formatDateOnly(os.dataInicio)}</span>
                <span>Fim {formatDateOnly(os.dataPrevisaoTermino)}</span>
              </div>
            </>
          ) : (
            <p className="mt-2 text-xs text-text-muted">Informe o início e a previsão de término no cadastro da OS.</p>
          )}
        </div>

        {/* Quanto da OS já foi executado (notas fiscais desta OS) */}
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-text-muted">Liquidado</span>
            <span className={`font-semibold tabular-nums ${executado > 100 ? "text-danger-text" : "text-text-secondary"}`}>
              {executado}%
            </span>
          </div>
          <div className="mt-2">
            <ProgressBar percent={executado} className={executado > 100 ? "bg-danger-text" : "bg-primary-500"} />
          </div>
          <p className="mt-1 text-[11px] text-text-muted tabular-nums">
            {formatCurrency(os.valorExecutado)} de {formatCurrency(os.valor)}
            {os.status === "ATIVO" && (
              <> · falta {formatCurrency(getBalance(os.valor, os.valorExecutado).saldo)}</>
            )}
          </p>
        </div>
      </div>
    </li>
  );
}

export function ViewObraModal({ obra, onEdit, handleClose }: ViewObraModalProps) {
  const { canEditEngenharia } = usePermission();
  const status = OBRA_STATUS[obra.status] ?? OBRA_STATUS.CANCELADA;
  const executado = percentOf(obra.valorExecutado, obra.valor);
  const balance = getObraBalance(obra);
  const hint = getObraDeadlineHint(obra);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Obra ${obra.nome}`}
        className="bg-surface rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border bg-linear-to-r from-primary-50/50 to-transparent shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
              <HardHat size={20} className="text-primary-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-text-primary truncate">
                <span className="text-primary-600">{obra.identificacaoPatrimonial}</span> · {obra.nome}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs">
                <span className={`px-2 py-0.5 rounded-full border font-medium ${status.badge}`}>{status.label}</span>
                <span className="text-text-muted">{OBRA_TIPO_LABEL[obra.tipo] ?? obra.tipo}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-surface-muted rounded-lg transition-colors cursor-pointer shrink-0"
            title="Fechar"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-6">
          {/* Resumo: orçamento, execução e prazo vêm das OS da obra */}
          <section className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <SummaryTile label="Emitido em OS" value={formatCurrency(obra.valor)}>
                <p className="text-xs text-text-muted mt-0.5">
                  {obra.ordensServico.length} OS
                </p>
              </SummaryTile>
              <SummaryTile label="Liquidado" value={formatCurrency(obra.valorExecutado)}>
                <p className="text-xs text-text-muted mt-0.5">{executado}% do emitido</p>
              </SummaryTile>
              <SummaryTile
                label="A liquidar"
                value={balance.kind === "paid" || balance.kind === "concluded" ? "Sem saldo" : formatCurrency(balance.saldo)}
              >
                <p className="text-xs text-text-muted mt-0.5">
                  {balance.kind === "paid" ? "Obra paga" : "nas OS ativas"}
                </p>
              </SummaryTile>
              <SummaryTile
                label="Prazo da obra"
                value={obra.dataPrevisaoTermino ? formatDateOnly(obra.dataPrevisaoTermino) : "Sem prazo"}
              >
                <p className={`text-xs mt-0.5 ${hint ? hint.className : "text-text-muted"}`}>
                  {obra.dataConclusao
                    ? `Concluída em ${formatDate(obra.dataConclusao)}`
                    : hint
                      ? hint.label
                      : obra.dataInicio
                        ? `Início ${formatDateOnly(obra.dataInicio)}`
                        : "Defina os prazos nas OS"}
                </p>
              </SummaryTile>
            </div>
            <ProgressBar percent={executado} className={executado > 100 ? "bg-danger-text" : "bg-primary-500"} />
            {/* Todas as OS sem saldo: a obra já pode ser concluída */}
            {balance.kind === "paid" && (
              <div className="flex items-center justify-between gap-3 flex-wrap rounded-lg border border-success-border bg-success-bg px-3.5 py-3">
                <p className="text-sm text-success-text">
                  <span className="font-semibold">Obra paga.</span> Nenhuma OS desta obra tem saldo a liquidar.
                </p>
                {canEditEngenharia && <CompleteObraButton obra={obra} />}
              </div>
            )}
          </section>

          {/* Ordens de serviço da obra */}
          <section>
            <div className="flex items-center gap-2 mb-2.5">
              <ClipboardList size={15} className="text-primary-500" />
              <h3 className="text-xs font-semibold text-text-secondary uppercase">
                Ordens de serviço ({obra.ordensServico.length})
              </h3>
              <div className="flex-1 h-px bg-border" />
            </div>
            {obra.ordensServico.length > 0 ? (
              <ul className="space-y-2.5">
                {obra.ordensServico.map((os) => (
                  <OrdemServicoCard key={os.id} os={os} obra={obra} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-muted">Nenhuma ordem de serviço vinculada.</p>
            )}
          </section>

          {/* Dados da obra */}
          <section>
            <div className="flex items-center gap-2 mb-2.5">
              <HardHat size={15} className="text-primary-500" />
              <h3 className="text-xs font-semibold text-text-secondary uppercase">Dados da obra</h3>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <Detail icon={UserCog} label="Responsável técnico">
                {obra.responsavelTecnico}
              </Detail>
              {obra.contrato && (
                <Detail icon={Building2} label="Contrato / empresa">
                  {obra.contrato.identificador} · {obra.contrato.company.name}
                </Detail>
              )}
              {obra.descricao && (
                <div className="sm:col-span-2">
                  <Detail icon={AlignLeft} label="Descrição">
                    {obra.descricao}
                  </Detail>
                </div>
              )}
              {obra.anotacoes && (
                <div className="sm:col-span-2">
                  <Detail icon={StickyNote} label="Anotações de campo">
                    {obra.anotacoes}
                  </Detail>
                </div>
              )}
              {obra.latitude != null && obra.longitude != null && (
                <Detail icon={MapPin} label="Coordenadas">
                  {obra.latitude}, {obra.longitude}
                </Detail>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-3.5 border-t border-border shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 cursor-pointer text-text-secondary hover:bg-surface-muted rounded-lg transition-colors font-medium text-sm"
          >
            Fechar
          </button>
          {canEditEngenharia && onEdit && (
            <button
              onClick={() => onEdit(obra)}
              className="inline-flex items-center gap-2 px-4 py-2 cursor-pointer bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium text-sm"
            >
              <Edit2 size={15} />
              Editar obra
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
