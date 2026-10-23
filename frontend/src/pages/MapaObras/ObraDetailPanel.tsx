import { useCallback, useEffect, useState } from "react";
import {
  X,
  Wrench,
  CheckCircle2,
  PauseCircle,
  XCircle,
  HardHat,
  Wallet,
  Building2,
  FileText,
  Clock,
  CalendarRange,
  ChevronRight,
  RefreshCw,
  Info,
} from "lucide-react";
import { formatCurrency, formatDate, formatDateOnly } from "../../utils/format-currency";
import { useObras } from "../../store/obras";
import type { Obra, ObraDetail, ObraDetailEmpenhoFinanceiro, ObraDetailFinancial, ObraStatus } from "../../../types/obra";
import { Card, PendingBadge, ProgressBar, StatusPill, VigenciaAlert } from "./obra-detail-shared";
import {
  daysUntil,
  formatPercent,
  INVOICE_STATUS,
  OBRA_TIPO_LABEL,
  percentOf,
  plural,
  RECORD_STATUS,
  dateOnlyUtc,
  todayUtc,
} from "./obra-detail-utils";
import { ContratoEmpenhosModal } from "./ContratoEmpenhosModal";
import { ObraInfoModal } from "./ObraInfoModal";
import { ObraTimeline } from "./ObraTimeline";
import { maskCnpj } from "../../utils/masks";
import { cx } from "../../utils/cx";
import { Badge, Button, IconButton, Table, TableBody, TableHead, Td, Th, Tr, type BadgeTone, TableFoot } from "../../components/ui";

/**
 * Painel lateral de detalhe da obra, no Mapa de Obras. Mostra a cadeia
 * Contrato → Empenho → OS/Obra, cada nível com seus próprios valores e prazos.
 * Os dados vêm de GET /obra/detail/:id (liquidado calculado a partir das NFs);
 * a obra da listagem só é usada para o cabeçalho aparecer sem esperar o fetch.
 * Campos com <PendingBadge /> ainda não têm dado no sistema — ver pendência #7
 * em frontend/CLAUDE.md antes de "completar" esses trechos.
 */

type Tab = "geral" | "notas-fiscais" | "cronograma";

const STATUS_BADGE: Record<ObraStatus, { label: string; icon: typeof Wrench; tone: BadgeTone }> = {
  EM_ANDAMENTO: { label: "Em Andamento", icon: Wrench, tone: "info" },
  CONCLUIDA: { label: "Concluída", icon: CheckCircle2, tone: "success" },
  PARALISADA: { label: "Paralisada", icon: PauseCircle, tone: "danger" },
  CANCELADA: { label: "Cancelada", icon: XCircle, tone: "neutral" },
};

type Deadline = { label: string; className: string; elapsed: number };

// Prazo da obra = menor início e maior previsão de término entre as OS dela
function getObraDeadline(obra: ObraDetail["obra"]): Deadline {
  if (!obra.dataInicio || !obra.dataPrevisaoTermino) {
    return { label: "Sem prazo definido", className: "text-text-muted", elapsed: 0 };
  }
  const start = dateOnlyUtc(obra.dataInicio);
  const end = dateOnlyUtc(obra.dataPrevisaoTermino);
  const today = todayUtc();
  const elapsed = end > start ? percentOf(today - start, end - start) : today >= end ? 100 : 0;

  if (obra.dataConclusao) {
    return { label: `Concluída em ${formatDate(obra.dataConclusao)}`, className: "text-success-text", elapsed: 100 };
  }
  if (obra.status === "CANCELADA") return { label: "Obra cancelada", className: "text-text-muted", elapsed };
  if (obra.status === "PARALISADA") return { label: "Obra paralisada", className: "text-warning-text", elapsed };
  if (today < start) {
    return { label: `Começa em ${plural(daysUntil(obra.dataInicio), "dia", "dias")}`, className: "text-info-text", elapsed: 0 };
  }

  const days = daysUntil(obra.dataPrevisaoTermino);
  if (days < 0) return { label: `Atrasada há ${plural(-days, "dia", "dias")}`, className: "text-danger-text", elapsed };
  if (days === 0) return { label: "Vence hoje", className: "text-warning-text", elapsed };
  if (days <= 15) return { label: `Vence em ${plural(days, "dia", "dias")}`, className: "text-warning-text", elapsed };
  return { label: `Faltam ${plural(days, "dia", "dias")}`, className: "text-success-text", elapsed };
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] text-text-muted">{label}</p>
      <p className={`text-[13px] font-semibold truncate ${tone ?? "text-text-primary"}`}>{value}</p>
    </div>
  );
}

function PeriodRow({ label, start, end }: { label: string; start: string; end: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text-primary">
        {formatDateOnly(start)} → {formatDateOnly(end)}
      </span>
    </div>
  );
}

// Barra empilhada do empenho: OS desta obra, outras OS e saldo livre para novas OS
function EmpenhoCommitmentBar({ financial }: { financial: ObraDetailEmpenhoFinanceiro }) {
  const { value, comprometidoOS } = financial;
  const estaOS = financial.valorNaOS;
  const outrasOS = Math.max(comprometidoOS - estaOS, 0);
  const base = Math.max(value, comprometidoOS);
  const segments = [
    { label: "Esta obra", amount: estaOS, className: "bg-accent-500" },
    { label: "Outras OS", amount: outrasOS, className: "bg-primary-400" },
  ];

  return (
    <div>
      <div className="flex h-2.5 w-full rounded-full bg-surface-muted overflow-hidden">
        {segments.map((s) => (
          <div
            key={s.label}
            className={s.className}
            style={{ width: `${percentOf(s.amount, base)}%` }}
            title={`${s.label}: ${formatCurrency(s.amount)}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[10.5px] text-text-secondary">
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1">
            <span className={`w-2 h-2 rounded-sm ${s.className}`} />
            {s.label} {formatPercent(percentOf(s.amount, value))}
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-surface-muted border border-border" />
          Livre {formatPercent(Math.max(percentOf(value - comprometidoOS, value), 0))}
        </span>
      </div>
    </div>
  );
}

function ObraCard({ detail, onOpenInfo }: { detail: ObraDetail; onOpenInfo: () => void }) {
  const { obra, ordensServico, financial } = detail;
  const deadline = getObraDeadline(obra);
  const liquidadoPercent = financial ? percentOf(financial.obra.liquidado, financial.obra.valor) : 0;

  return (
    <Card
      icon={<HardHat size={14} />}
      title={`Obra · ${plural(ordensServico.length, "OS", "OS")}`}
    >
      {financial && (
        <div className="mb-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-[11px] text-text-muted">Valor das OS</p>
              <p className="text-[15px] font-bold text-text-primary">{formatCurrency(financial.obra.valor)}</p>
            </div>
            <p className="text-[11px] text-text-secondary text-right">
              <span className="font-semibold text-success-text">{formatCurrency(financial.obra.liquidado)}</span>{" "}
              liquidado
            </p>
          </div>
          <div className="mt-1.5">
            <ProgressBar percent={liquidadoPercent} colorClassName="bg-secondary-500" />
          </div>
          <p className="text-[10px] text-text-muted text-right mt-0.5">
            {formatPercent(liquidadoPercent)} liquidado em notas fiscais
          </p>
        </div>
      )}

      <div className="rounded-lg bg-surface-muted/70 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-text-muted">Prazo da obra</span>
          <span className={`font-semibold ${deadline.className}`}>{deadline.label}</span>
        </div>
        {obra.dataInicio && obra.dataPrevisaoTermino && (
          <>
            <p className="text-[13px] font-medium text-text-primary mt-1">
              {formatDateOnly(obra.dataInicio)} → {formatDateOnly(obra.dataConclusao ?? obra.dataPrevisaoTermino)}
            </p>
            <div className="mt-1.5">
              <ProgressBar
                percent={deadline.elapsed}
                colorClassName={deadline.className === "text-danger-text" ? "bg-danger-text" : "bg-accent-500"}
              />
            </div>
          </>
        )}
      </div>

      {/* Cada OS da obra com o prazo e o quanto já foi executado */}
      <ul className="mt-3 space-y-2">
        {ordensServico.map((os) => (
          <li key={os.id} className="rounded-lg border border-border px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-text-primary">OS {os.numero}</span>
              <StatusPill status={os.status} map={RECORD_STATUS} />
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              {os.dataInicio && os.dataPrevisaoTermino
                ? `${formatDateOnly(os.dataInicio)} → ${formatDateOnly(os.dataPrevisaoTermino)}`
                : "Sem prazo definido"}
            </p>
            {financial && (
              <div className="mt-1.5">
                <ProgressBar percent={percentOf(os.valorExecutado, os.valor)} colorClassName="bg-secondary-500" />
                <p className="text-[10px] text-text-muted text-right mt-0.5">
                  {formatCurrency(os.valorExecutado)} de {formatCurrency(os.valor)} ·{" "}
                  {formatPercent(percentOf(os.valorExecutado, os.valor))}
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onOpenInfo}
        className="mt-3 w-full flex items-center justify-between gap-2 text-xs font-semibold text-text-primary hover:text-text-secondary transition-colors cursor-pointer"
      >
        <span className="inline-flex items-center gap-1.5">
          <Info size={13} />
          Detalhes da obra, responsável técnico e descrição
        </span>
        <ChevronRight size={14} />
      </button>
    </Card>
  );
}

// Um cartão por empenho que financia as OS da obra (uma OS pode receber vários empenhos do contrato)
function EmpenhoCard({
  empenho,
  financial,
}: {
  empenho: ObraDetail["empenhos"][number];
  financial: ObraDetailEmpenhoFinanceiro | null;
}) {
  return (
    <Card
      icon={<Wallet size={14} />}
      title={`Empenho ${empenho.numero}`}
      action={<StatusPill status={empenho.status} map={RECORD_STATUS} />}
    >
      <p className="text-xs text-text-secondary mb-2.5 line-clamp-2" title={empenho.description}>
        {empenho.description}
      </p>

      {financial && (
        <>
          <p className="text-[11px] text-text-muted">Valor empenhado</p>
          <p className="text-[15px] font-bold text-text-primary mb-2">{formatCurrency(financial.value)}</p>

          <EmpenhoCommitmentBar financial={financial} />
          <p className="text-xs text-text-secondary mt-2">
            As OS desta obra recebem{" "}
            <span className="font-semibold text-accent-600">
              {formatCurrency(financial.valorNaOS)} ({formatPercent(percentOf(financial.valorNaOS, financial.value))})
            </span>{" "}
            do empenho ({plural(financial.ordensServicoCount, "OS ativa", "OS ativas")}).
          </p>
          <p className="text-xs text-text-secondary mt-1">
            Liquidado nesta obra:{" "}
            <span className="font-semibold text-text-primary">{formatCurrency(financial.liquidadoNaOS)}</span> de{" "}
            {formatCurrency(financial.valorNaOS)}
          </p>

          <div className="grid grid-cols-3 gap-2 my-3 pt-3 border-t border-border">
            <Metric label="Liquidado" value={formatCurrency(financial.liquidado)} tone="text-success-text" />
            <Metric
              label="Saldo a liquidar"
              value={formatCurrency(financial.value - financial.liquidado)}
              tone="text-accent-600"
            />
            <Metric
              label="Livre p/ novas OS"
              value={formatCurrency(financial.value - financial.comprometidoOS)}
              tone={financial.value - financial.comprometidoOS < 0 ? "text-danger-text" : "text-text-primary"}
            />
          </div>
          <div className="mb-3">
            <ProgressBar
              percent={percentOf(financial.liquidado, financial.value)}
              colorClassName="bg-secondary-500"
            />
            <p className="text-[10px] text-text-muted text-right mt-0.5">
              {formatPercent(percentOf(financial.liquidado, financial.value))} do empenho liquidado
            </p>
          </div>
        </>
      )}

      <VigenciaAlert label="Vigência do empenho" endAt={empenho.endAt} />
    </Card>
  );
}

function ContratoCard({ detail, onOpenEmpenhos }: { detail: ObraDetail; onOpenEmpenhos: () => void }) {
  const { contrato, financial } = detail;

  return (
    <Card
      icon={<Building2 size={14} />}
      title="Contrato"
      action={<StatusPill status={contrato.status} map={RECORD_STATUS} />}
    >
      <div className="flex items-start gap-2 mb-2.5">
        <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ backgroundColor: contrato.cor }} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">{contrato.identificador}</p>
          <p className="text-xs text-text-secondary mt-0.5">{contrato.descricaoCurta}</p>
        </div>
      </div>
      <div className="mb-3">
        <p className="text-sm font-medium text-text-primary">{contrato.company.name}</p>
        <p className="text-[11px] text-text-muted mt-0.5">CNPJ {maskCnpj(contrato.company.cnpj)}</p>
      </div>

      {financial && (
        <div className="space-y-2.5 mb-3">
          <div>
            <p className="text-[11px] text-text-muted">Valor total do contrato</p>
            <p className="text-[15px] font-bold text-text-primary">{formatCurrency(financial.contrato.valor)}</p>
          </div>
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-text-secondary">Empenhado</span>
              <span className="font-semibold text-text-primary">
                {formatCurrency(financial.contrato.totalEmpenhado)} ·{" "}
                {formatPercent(percentOf(financial.contrato.totalEmpenhado, financial.contrato.valor))}
              </span>
            </div>
            <ProgressBar
              percent={percentOf(financial.contrato.totalEmpenhado, financial.contrato.valor)}
              colorClassName="bg-primary-500"
            />
          </div>
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-text-secondary">Utilizado (NFs)</span>
              <span className="font-semibold text-success-text">
                {formatCurrency(financial.contrato.totalLiquidado)} ·{" "}
                {formatPercent(percentOf(financial.contrato.totalLiquidado, financial.contrato.valor))}
              </span>
            </div>
            <ProgressBar
              percent={percentOf(financial.contrato.totalLiquidado, financial.contrato.valor)}
              colorClassName="bg-secondary-500"
            />
          </div>
        </div>
      )}

      <PeriodRow label="Vigência" start={contrato.dataInicio} end={contrato.dataFim} />

      {financial && (
        <button
          type="button"
          onClick={onOpenEmpenhos}
          className="mt-3 w-full flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-text-primary hover:bg-surface-muted hover:border-border-strong transition-colors cursor-pointer"
        >
          Ver empenhos do contrato ({financial.contrato.empenhos.length})
          <ChevronRight size={14} />
        </button>
      )}
    </Card>
  );
}

function InvoicesTab({ financial }: { financial: ObraDetailFinancial }) {
  const { invoices, obra } = financial;

  return (
    <Card icon={<FileText size={14} />} title="Notas fiscais desta obra">
      {invoices.length === 0 ? (
        <p className="text-sm text-text-muted bg-surface-muted rounded-lg px-3 py-4 text-center">
          Nenhuma nota fiscal vinculada a esta obra.
        </p>
      ) : (
        // Painel de 480px: a descrição da nota fica numa linha cortada (com `wrap` a coluna não caberia)
        <Table compact>
          <TableHead>
            <Th>Nota</Th>
            <Th>Vencimento</Th>
            <Th>Situação</Th>
            <Th>Valor</Th>
          </TableHead>
          <TableBody>
            {invoices.map((invoice) => {
              const cancelled = invoice.status === "CANCELADO";
              return (
                <Tr key={invoice.id}>
                  <Td>
                    <p className={cancelled ? "line-through text-text-muted" : "text-text-primary"}>{invoice.numero}</p>
                    <p className="text-[10.5px] text-text-muted truncate max-w-30" title={invoice.description}>
                      {invoice.description}
                    </p>
                  </Td>
                  <Td>
                    <span className="text-text-secondary">{formatDateOnly(invoice.vencimento)}</span>
                  </Td>
                  <Td>
                    <StatusPill status={invoice.status} map={INVOICE_STATUS} />
                  </Td>
                  <Td>
                    <span className={cx("font-medium", cancelled ? "line-through text-text-muted" : "text-text-primary")}>
                      {formatCurrency(invoice.value)}
                    </span>
                  </Td>
                </Tr>
              );
            })}
          </TableBody>
          {/* Rodapé sem colSpan (o Td não aceita): o rótulo quebra linha para não alargar a 1ª coluna */}
          <TableFoot>
            <Tr>
              <Td>
                <p className="font-semibold text-text-primary">Total liquidado</p>
                <p className="max-w-30 whitespace-normal text-[10.5px] text-text-muted">
                  {formatPercent(percentOf(obra.liquidado, obra.valor))} do valor das OS · canceladas não somam
                </p>
              </Td>
              <Td />
              <Td />
              <Td>
                <span className="font-semibold text-success-text">{formatCurrency(obra.liquidado)}</span>
              </Td>
            </Tr>
          </TableFoot>
        </Table>
      )}
    </Card>
  );
}

function ScheduleTab({ detail }: { detail: ObraDetail }) {
  const { obra, ordensServico, empenhos, contrato } = detail;

  return (
    <>
      <Card icon={<CalendarRange size={14} />} title="Cronograma comparativo">
        <ObraTimeline detail={detail} />
      </Card>

      <Card icon={<Clock size={14} />} title="Prazos">
        <div className="space-y-2">
          {ordensServico.map((os) =>
            os.dataInicio && os.dataPrevisaoTermino ? (
              <PeriodRow key={os.id} label={`OS ${os.numero}`} start={os.dataInicio} end={os.dataPrevisaoTermino} />
            ) : null,
          )}
          {obra.dataConclusao && (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-text-muted">Conclusão da obra</span>
              <span className="font-medium text-success-text">{formatDate(obra.dataConclusao)}</span>
            </div>
          )}
          {empenhos.map((empenho) => (
            <PeriodRow key={empenho.id} label={`Empenho ${empenho.numero}`} start={empenho.startAt} end={empenho.endAt} />
          ))}
          <PeriodRow label="Contrato" start={contrato.dataInicio} end={contrato.dataFim} />
        </div>
        <div className="mt-3 space-y-2">
          {empenhos.map((empenho) => (
            <VigenciaAlert key={empenho.id} label={`Vigência do empenho ${empenho.numero}`} endAt={empenho.endAt} />
          ))}
          <VigenciaAlert label="Vigência do contrato" endAt={contrato.dataFim} />
        </div>
      </Card>

      <div className="rounded-xl border border-border bg-surface p-4 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-text-primary">Histórico de aditivos de prazo</span>
        <PendingBadge />
      </div>
    </>
  );
}

function PendingFields() {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-3 grid grid-cols-2 gap-x-3 gap-y-2">
      {["Aditivo Total", "E-PAG", "% Exec. Física", "Var. Físico/Financ."].map((label) => (
        <div key={label} className="flex items-center justify-between gap-1">
          <span className="text-[11px] text-text-secondary truncate">{label}</span>
          <PendingBadge />
        </div>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3.5 animate-pulse">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-2.5">
          <div className="h-2.5 w-24 rounded bg-surface-muted" />
          <div className="h-4 w-40 rounded bg-surface-muted" />
          <div className="h-1.5 w-full rounded bg-surface-muted" />
          <div className="h-2.5 w-2/3 rounded bg-surface-muted" />
        </div>
      ))}
    </div>
  );
}

export default function ObraDetailPanel({ obra, onClose }: { obra: Obra | null; onClose: () => void }) {
  const { fetchObraDetail } = useObras();
  const [tab, setTab] = useState<Tab>("geral");
  const [detail, setDetail] = useState<ObraDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isEmpenhosOpen, setIsEmpenhosOpen] = useState(false);

  const obraId = obra?.id;

  const load = useCallback(() => {
    if (!obraId) return;
    return fetchObraDetail(obraId)
      .then(setDetail)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Erro ao carregar detalhes da obra"));
  }, [obraId, fetchObraDetail]);

  // O painel é remontado a cada obra (key na página), então o estado inicial já está limpo
  useEffect(() => {
    load();
  }, [load]);

  const retry = () => {
    setError(null);
    load();
  };

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (obraId) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [obraId, onClose]);

  if (!obra) return null;

  const statusBadge = STATUS_BADGE[obra.status];
  const contratoCor = detail?.contrato.cor ?? obra.contrato?.cor ?? "#27272a";
  const financial = detail?.financial ?? null;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "geral", label: "Geral" },
    ...(financial ? [{ id: "notas-fiscais" as const, label: "Notas Fiscais", count: financial.invoices.length }] : []),
    { id: "cronograma", label: "Cronograma" },
  ];

  return (
    <>
      {/* Backdrop — clique fora fecha o painel, igual um drawer/modal */}
      <div className="fixed inset-0 bg-black/20 z-1200" onClick={onClose} />

      <aside className="fixed inset-y-0 right-0 z-1201 w-full sm:w-[480px] bg-background shadow-2xl flex flex-col animate-slide-in-right">
        {/* Faixa na cor do contrato — mesma identidade visual usada nos marcadores do mapa */}
        <div className="h-1 w-full shrink-0" style={{ backgroundColor: contratoCor }} />

        <div className="relative bg-surface border-b border-border px-5 pt-4 pb-4 shrink-0">
          <IconButton icon={X} label="Fechar" size="sm" onClick={onClose} className="absolute top-3 right-3" />

          <Badge tone={statusBadge.tone} icon={statusBadge.icon}>
            {statusBadge.label}
          </Badge>

          <h2 className="mt-2.5 text-lg font-semibold leading-tight text-text-primary break-words pr-8">{obra.nome}</h2>
          <p className="mt-1 text-xs text-text-secondary flex items-center gap-1.5 flex-wrap">
            <span>{obra.identificacaoPatrimonial}</span>
            <span className="w-1 h-1 rounded-full bg-text-muted shrink-0" />
            <span>{OBRA_TIPO_LABEL[obra.tipo]}</span>
            {obra.ordensServico.length > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-text-muted shrink-0" />
                <span>OS {obra.ordensServico.map((os) => os.numero).join(", ")}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex bg-surface border-b border-border shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
                tab === t.id
                  ? "border-primary-500 text-text-primary"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span
                  className={`text-[10px] font-semibold rounded-md px-1.5 py-0.5 ${
                    tab === t.id ? "bg-primary-100 text-text-primary" : "bg-surface-muted text-text-muted"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
          {error ? (
            <div className="rounded-xl border border-danger-border bg-danger-bg px-4 py-5 text-center">
              <p className="text-sm text-danger-text">Não foi possível carregar os detalhes da obra.</p>
              <Button variant="secondary" size="sm" icon={RefreshCw} onClick={retry} className="mt-3">
                Tentar novamente
              </Button>
            </div>
          ) : !detail ? (
            <LoadingState />
          ) : (
            <>
              {tab === "geral" && (
                <>
                  <ObraCard detail={detail} onOpenInfo={() => setIsInfoOpen(true)} />
                  {detail.empenhos.map((empenho) => (
                    <EmpenhoCard
                      key={empenho.id}
                      empenho={empenho}
                      financial={detail.financial?.empenhos.find((e) => e.id === empenho.id) ?? null}
                    />
                  ))}
                  <ContratoCard detail={detail} onOpenEmpenhos={() => setIsEmpenhosOpen(true)} />
                  {financial && <PendingFields />}
                </>
              )}
              {tab === "notas-fiscais" && financial && <InvoicesTab financial={financial} />}
              {tab === "cronograma" && <ScheduleTab detail={detail} />}
            </>
          )}
        </div>
      </aside>

      {detail && isInfoOpen && <ObraInfoModal detail={detail} onClose={() => setIsInfoOpen(false)} />}
      {detail?.financial && isEmpenhosOpen && (
        <ContratoEmpenhosModal
          contrato={detail.contrato}
          financial={detail.financial.contrato}
          currentEmpenhoIds={detail.empenhos.map((e) => e.id)}
          onClose={() => setIsEmpenhosOpen(false)}
        />
      )}
    </>
  );
}
