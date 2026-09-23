import { useMemo, useState } from "react";
import {
  X,
  Wrench,
  CheckCircle2,
  PauseCircle,
  XCircle,
  MapPin,
  User,
  Calendar,
  Wallet,
  Building2,
  FileText,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/format-currency";
import { usePermission } from "../../hooks/usePermission";
import type { Obra, ObraStatus, ObraTipo } from "../../../types/obra";

/**
 * Painel de detalhe da obra, no Mapa de Obras — redesenhado a partir da
 * proposta aprovada em 2026-09-02 (canvas "Painel de Obra"), que abandonou
 * de propósito o visual das imagens em frontend/referencias/ (header escuro,
 * campos vermelho+negrito). Todo campo sinalizado com <PendingBadge /> não
 * tem dado real no sistema ainda — ver pendência #8 em frontend/CLAUDE.md
 * antes de tentar "corrigir" esses trechos.
 */

type Tab = "geral" | "notas-fiscais" | "cronograma";

const STATUS_BADGE: Record<
  ObraStatus,
  { label: string; icon: typeof Wrench; className: string }
> = {
  EM_ANDAMENTO: { label: "Em Andamento", icon: Wrench, className: "bg-accent-500 text-white" },
  CONCLUIDA: { label: "Concluída", icon: CheckCircle2, className: "bg-secondary-500 text-white" },
  PARALISADA: { label: "Paralisada", icon: PauseCircle, className: "bg-warning-text text-white" },
  CANCELADA: { label: "Cancelada", icon: XCircle, className: "bg-danger-text text-white" },
};

const TIPO_LABEL: Record<ObraTipo, string> = {
  CONSTRUCAO: "Construção",
  REFORMA: "Reforma",
  AMPLIACAO: "Ampliação",
  PAVIMENTACAO: "Pavimentação",
  SANEAMENTO: "Saneamento",
  MANUTENCAO_PREDIAL: "Manutenção Predial",
  OUTRO: "Outro",
};

const EMPENHO_TIMELINE_STATUS: Record<string, { label: string; className: string }> = {
  ATIVO: { label: "Em andamento", className: "bg-accent-50 text-accent-600" },
  FINALIZADO: { label: "Concluído", className: "bg-success-bg text-success-text" },
  CANCELADO: { label: "Cancelado", className: "bg-danger-bg text-danger-text" },
};

function PendingBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-border-strong bg-surface-muted text-text-muted text-[10px] font-semibold shrink-0">
      <Clock size={10} />
      Em breve
    </span>
  );
}

function Dot() {
  return <span className="w-1 h-1 rounded-full bg-text-muted shrink-0" />;
}

function getDaysRemaining(endAt: string | Date): number {
  const end = new Date(endAt);
  end.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function VigenciaAlert({ endAt }: { endAt: string | Date }) {
  const days = getDaysRemaining(endAt);
  const expired = days < 0;
  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
        expired
          ? "bg-danger-bg border-danger-border text-danger-text"
          : days <= 30
            ? "bg-warning-bg border-warning-border text-warning-text"
            : "bg-success-bg border-success-border text-success-text"
      }`}
    >
      <AlertTriangle size={13} className="shrink-0" />
      Vigência até {formatDate(endAt)} —{" "}
      {expired ? "expirado" : `${days} dia${days === 1 ? "" : "s"} restante${days === 1 ? "" : "s"}`}
    </div>
  );
}

function ProgressBar({ percent, colorClassName }: { percent: number; colorClassName: string }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="w-full h-1.5 rounded-full bg-surface-muted overflow-hidden">
      <div className={`h-full rounded-full ${colorClassName}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-text-muted flex">{icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-wide text-text-muted">{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function ObraDetailPanel({ obra, onClose }: { obra: Obra | null; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("geral");
  const { canViewAdministrativo } = usePermission();

  // Vem embutido na resposta de GET /obra/list (já filtrado pra essa obra
  // especificamente, via Invoice.obra_id) — o servidor só popula esse array
  // quando o usuário tem permissão de ver o domínio administrativo; do
  // contrário vem sempre vazio, mesmo que existam notas fiscais de verdade.
  const notasFiscais = useMemo(() => obra?.invoices ?? [], [obra]);

  const totalMedido = useMemo(
    () => notasFiscais.reduce((sum, inv) => sum + inv.value, 0),
    [notasFiscais],
  );

  if (!obra) return null;

  const { ordemServico } = obra;
  const empenho = ordemServico?.empenho;
  const contrato = empenho?.contrato;

  if (!ordemServico || !empenho || !contrato) {
    return (
      <>
        <div className="fixed inset-0 bg-black/20 z-[1200]" onClick={onClose} />
        <aside className="fixed inset-y-0 right-0 z-[1201] w-full sm:w-[480px] bg-surface shadow-2xl flex flex-col items-center justify-center gap-3 p-6 animate-slide-in-right">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-text-muted hover:text-text-primary cursor-pointer"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
          <p className="text-sm text-text-muted text-center">
            Dados de ordem de serviço/empenho/contrato indisponíveis para esta obra.
          </p>
        </aside>
      </>
    );
  }

  const statusBadge = STATUS_BADGE[obra.status];
  const StatusIcon = statusBadge.icon;
  const tipoLabel = TIPO_LABEL[obra.tipo];
  const saldoAFaturar = empenho.value - empenho.totalPaid;
  const financeiroPercent = empenho.value > 0 ? (empenho.totalPaid / empenho.value) * 100 : 0;
  const timelineStatus =
    EMPENHO_TIMELINE_STATUS[empenho.status] ?? { label: empenho.status, className: "bg-surface-muted text-text-secondary" };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "geral", label: "Geral" },
    { id: "notas-fiscais", label: "Notas Fiscais", count: notasFiscais.length },
    { id: "cronograma", label: "Cronograma" },
  ];

  return (
    <>
      {/* Backdrop — clique fora fecha o painel, igual um drawer/modal */}
      <div className="fixed inset-0 bg-black/20 z-[1200]" onClick={onClose} />

      <aside className="fixed inset-y-0 right-0 z-[1201] w-full sm:w-[480px] bg-background shadow-2xl flex flex-col animate-slide-in-right">
        {/* Faixa na cor do contrato — mesma identidade visual usada nos marcadores do mapa */}
        <div className="h-1 w-full shrink-0" style={{ backgroundColor: contrato.cor }} />

        {/* Header */}
        <div className="relative bg-surface border-b border-border px-5 pt-4 pb-4 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${statusBadge.className}`}
          >
            <StatusIcon size={12} />
            {statusBadge.label}
          </span>

          <h2 className="mt-2.5 text-lg font-bold leading-tight text-text-primary break-words pr-8">
            {obra.nome}
          </h2>
          <p className="mt-1 text-xs text-text-secondary flex items-center gap-1.5 flex-wrap">
            <span>{tipoLabel}</span>
            <Dot />
            <span>{obra.identificacaoPatrimonial}</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-surface border-b border-border shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
                tab === t.id
                  ? "border-accent-500 text-accent-600"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span
                  className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${
                    tab === t.id ? "bg-accent-50 text-accent-600" : "bg-surface-muted text-text-muted"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
          {tab === "geral" && (
            <>
              <Card icon={<MapPin size={14} />} title="Sobre a obra">
                <div className="flex items-start gap-2 mb-2.5">
                  <User size={15} className="text-text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-text-muted">Responsável técnico</p>
                    <p className="text-[13px] font-medium text-text-primary">{obra.responsavelTecnico}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar size={15} className="text-text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-text-muted">
                      {obra.dataConclusao ? "Início — Conclusão" : "Início — Previsão de término"}
                    </p>
                    <p className="text-[13px] font-medium text-text-primary">
                      {formatDate(obra.dataInicio)} —{" "}
                      {formatDate(obra.dataConclusao ?? obra.dataPrevisaoTermino)}
                    </p>
                  </div>
                </div>
                {obra.anotacoes && (
                  <div className="mt-2.5 bg-surface-muted rounded-lg px-2.5 py-2 text-xs text-text-secondary italic leading-relaxed">
                    "{obra.anotacoes}"
                  </div>
                )}
              </Card>

              <Card icon={<Wallet size={14} />} title="Execução Financeira">
                <div className="flex items-start gap-2 mb-2.5">
                  <Wallet size={15} className="text-text-muted shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-text-muted">Valor do Empenho</p>
                    <p className="text-[15px] font-bold text-text-primary">{formatCurrency(empenho.value)}</p>
                    <div className="mt-1.5">
                      <ProgressBar percent={financeiroPercent} colorClassName="bg-secondary-500" />
                    </div>
                    <p className="text-[10px] text-text-muted text-right mt-0.5">
                      {financeiroPercent.toFixed(0)}% liquidado
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-2.5">
                  <div>
                    <p className="text-[10px] text-text-muted">Liquidado</p>
                    <p className="text-[13px] font-semibold text-success-text truncate">{formatCurrency(empenho.totalPaid)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted">Saldo</p>
                    <p className="text-[13px] font-semibold text-accent-600 truncate">{formatCurrency(saldoAFaturar)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted">Desta OS</p>
                    <p className="text-[13px] font-semibold text-text-primary truncate">{formatCurrency(ordemServico.valor)}</p>
                  </div>
                </div>

                <VigenciaAlert endAt={empenho.endAt} />

                <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-2.5 pt-2.5 border-t border-border">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] text-text-secondary truncate">Aditivo Total</span>
                    <PendingBadge />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] text-text-secondary truncate">E-PAG</span>
                    <PendingBadge />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] text-text-secondary truncate">% Exec. Física</span>
                    <PendingBadge />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] text-text-secondary truncate">Var. Físico/Financ.</span>
                    <PendingBadge />
                  </div>
                </div>
              </Card>

              <Card icon={<Building2 size={14} />} title="Contrato">
                <div className="flex items-start gap-2 mb-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                    style={{ backgroundColor: contrato.cor }}
                  />
                  <div>
                    <p className="text-sm font-bold text-text-primary">{contrato.identificador}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{contrato.descricaoCurta}</p>
                  </div>
                </div>
                <div className="mb-2.5">
                  <p className="text-sm font-medium text-text-primary">{contrato.company.name}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">CNPJ {contrato.company.cnpj}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">Ordem de Serviço</span>
                  <span className="text-sm font-semibold text-text-primary">{ordemServico.numero}</span>
                </div>
              </Card>
            </>
          )}

          {tab === "notas-fiscais" && (
            <Card icon={<FileText size={14} />} title="Notas Fiscais Apresentadas">
              {!canViewAdministrativo ? (
                <p className="text-sm text-text-muted bg-surface-muted rounded-lg px-3 py-4 text-center">
                  Você não tem permissão para visualizar notas fiscais.
                </p>
              ) : notasFiscais.length === 0 ? (
                <p className="text-sm text-text-muted bg-surface-muted rounded-lg px-3 py-4 text-center">
                  Nenhuma nota fiscal emitida para este empenho.
                </p>
              ) : (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm min-w-[320px]">
                    <thead>
                      <tr className="text-[10.5px] text-text-muted uppercase tracking-wide border-b border-border">
                        <th className="text-left font-bold py-1.5 px-1">Nota Fiscal</th>
                        <th className="text-left font-bold py-1.5 px-1">Vencimento</th>
                        <th className="text-right font-bold py-1.5 px-1">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notasFiscais.map((inv) => (
                        <tr key={inv.id} className="border-b border-border/60">
                          <td className="py-2 px-1 text-text-primary">{inv.numero}</td>
                          <td className="py-2 px-1 text-text-secondary">{formatDate(inv.vencimento)}</td>
                          <td className="py-2 px-1 text-right font-medium text-text-primary">
                            {formatCurrency(inv.value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2} className="py-2 px-1 font-bold text-text-primary">
                          Total medido
                        </td>
                        <td className="py-2 px-1 text-right font-bold text-text-primary">
                          {formatCurrency(totalMedido)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </Card>
          )}

          {tab === "cronograma" && (
            <>
              <Card icon={<Clock size={14} />} title="Prazos de Execução">
                <div className="flex items-start gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-500 border-2 border-accent-50 shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-text-primary">Prazo do Empenho</span>
                      <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${timelineStatus.className}`}>
                        {timelineStatus.label}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {formatDate(empenho.startAt)} → {formatDate(empenho.endAt)}
                    </p>
                  </div>
                </div>
                <div className="mt-3.5">
                  <VigenciaAlert endAt={empenho.endAt} />
                </div>
              </Card>

              <div className="rounded-xl border border-border bg-surface p-4 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-text-primary">Histórico de aditivos de prazo</span>
                <PendingBadge />
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
