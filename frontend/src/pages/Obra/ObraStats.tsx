import { useState } from "react";
import {
  HardHat,
  Activity,
  CheckCircle2,
  PauseCircle,
  XCircle,
  TrendingUp,
  X,
  DollarSign,
  BarChart3,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { StatCard } from "../../components/StatCard";
import type { ObraStats as ObraStatsType } from "../../../types/obra";

interface ObraStatsProps {
  stats: ObraStatsType;
  formatCurrency: (v: number) => string;
}

function FinanceiroModal({
  stats,
  formatCurrency,
  onClose,
}: {
  stats: ObraStatsType;
  formatCurrency: (v: number) => string;
  onClose: () => void;
}) {
  const execPct =
    stats.orcamentoTotal > 0
      ? Math.round((stats.valorExecutadoTotal / stats.orcamentoTotal) * 100)
      : 0;

  const saldo = stats.orcamentoTotal - stats.valorExecutadoTotal;
  const mediaExecAtiva =
    stats.emAndamento > 0
      ? stats.valorExecutadoTotal / stats.emAndamento
      : 0;

  const barColor =
    execPct >= 90
      ? { bar: "bg-danger-text", text: "text-danger-text", badge: "bg-danger-bg text-danger-text border border-danger-border" }
      : execPct >= 60
        ? { bar: "bg-warning-text", text: "text-warning-text", badge: "bg-warning-bg text-warning-text border border-warning-border" }
        : { bar: "bg-primary-500", text: "text-primary-500", badge: "bg-primary-50 text-primary-600 border border-primary-200" };

  const statusRows = [
    {
      label: "Em Andamento",
      count: stats.emAndamento,
      icon: Activity,
      colorClass: "text-warning-text",
      bg: "bg-warning-bg",
    },
    {
      label: "Concluídas",
      count: stats.concluidas,
      icon: CheckCircle2,
      colorClass: "text-success-text",
      bg: "bg-success-bg",
    },
    {
      label: "Paralisadas",
      count: stats.paralisadas,
      icon: PauseCircle,
      colorClass: "text-danger-text",
      bg: "bg-danger-bg",
    },
    {
      label: "Canceladas",
      count: stats.canceladas,
      icon: XCircle,
      colorClass: "text-text-muted",
      bg: "bg-surface-muted",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-lg shadow-2xl border border-border flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-linear-to-r from-primary-50/60 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <BarChart3 size={20} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Execução Financeira</h2>
              <p className="text-xs text-text-secondary">Resumo orçamentário de todas as obras</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-muted rounded-lg transition-colors"
          >
            <X size={18} className="text-text-secondary" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Percentual principal */}
          <div className="text-center">
            <p className="text-xs font-medium text-text-muted uppercase tracking-widest mb-1">Percentual executado</p>
            <p className={`text-6xl font-black ${barColor.text}`}>{execPct}%</p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${barColor.badge}`}>
              {execPct >= 90 ? "Atenção: orçamento crítico" : execPct >= 60 ? "Execução avançada" : "Execução dentro do previsto"}
            </span>
          </div>

          {/* Barra de progresso */}
          <div>
            <div className="flex justify-between text-xs text-text-muted mb-1.5">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
            <div className="h-4 bg-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor.bar}`}
                style={{ width: `${Math.min(execPct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-text-secondary">
                Executado: <span className="font-semibold text-text-primary">{formatCurrency(stats.valorExecutadoTotal)}</span>
              </span>
              <span className="text-xs text-text-secondary">
                Total: <span className="font-semibold text-text-primary">{formatCurrency(stats.orcamentoTotal)}</span>
              </span>
            </div>
          </div>

          {/* Cards de valores */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-muted rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={14} className="text-success-text" />
                <p className="text-xs font-medium text-text-secondary">Saldo disponível</p>
              </div>
              <p className={`text-lg font-bold ${saldo < 0 ? "text-danger-text" : "text-success-text"}`}>
                {formatCurrency(saldo)}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {saldo < 0 ? "Orçamento estourado" : `${100 - execPct}% restante`}
              </p>
            </div>
            <div className="bg-surface-muted rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-primary-500" />
                <p className="text-xs font-medium text-text-secondary">Média por obra ativa</p>
              </div>
              <p className="text-lg font-bold text-text-primary">
                {formatCurrency(mediaExecAtiva)}
              </p>
              <p className="text-xs text-text-muted mt-0.5">{stats.emAndamento} obra(s) em andamento</p>
            </div>
          </div>

          {/* Distribuição por status */}
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Distribuição por status
            </p>
            <div className="space-y-2">
              {statusRows.map(({ label, count, icon: Icon, colorClass, bg }) => {
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                      <Icon size={13} className={colorClass} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-xs text-text-primary font-medium">{label}</span>
                        <span className="text-xs text-text-muted">{count} · {pct}%</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${bg.replace("bg-", "bg-").replace("-bg", "-text")} opacity-70`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alerta se crítico */}
          {execPct >= 80 && (
            <div className="flex items-start gap-3 bg-warning-bg border border-warning-border rounded-xl p-4">
              <AlertTriangle size={16} className="text-warning-text shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-warning-text">Atenção ao orçamento</p>
                <p className="text-xs text-warning-text/80 mt-0.5">
                  {execPct >= 90
                    ? "Orçamento em estado crítico. Avalie a necessidade de suplementação ou remanejamento de verbas."
                    : "Mais de 80% do orçamento comprometido. Monitore os gastos das obras em andamento."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export function ObraStats({ stats, formatCurrency }: ObraStatsProps) {
  const [showModal, setShowModal] = useState(false);

  const x =
    stats.orcamentoTotal > 0
      ? Math.round((stats.valorExecutadoTotal / stats.orcamentoTotal) * 100)
      : 0;

  const execucaoPercent =
    stats.orcamentoTotal > 0
      ? Math.round((stats.valorExecutadoTotal / stats.orcamentoTotal) * 100)
      : 0;

  const barColor =
    execucaoPercent >= 90 ? "bg-danger-text" : execucaoPercent >= 60 ? "bg-warning-text" : "bg-primary-500";

  const textColor =
    execucaoPercent >= 90 ? "text-danger-text" : execucaoPercent >= 60 ? "text-warning-text" : "text-primary-600";

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
        <StatCard
          title="Total de Obras"
          value={stats.total.toString()}
          subtitle={formatCurrency(stats.orcamentoTotal)}
          icon={<HardHat size={18} className="text-primary-500" />}
          color="bg-primary-100"
          iconRounded="rounded-lg"
          compact
        />
        <StatCard
          title="Em Andamento"
          value={stats.emAndamento.toString()}
          subtitle="obras ativas"
          icon={<Activity size={18} className="text-warning-text" />}
          color="bg-warning-bg"
          iconRounded="rounded-lg"
          compact
        />
        <StatCard
          title="Concluídas"
          value={stats.concluidas.toString()}
          subtitle="obras finalizadas"
          icon={<CheckCircle2 size={18} className="text-success-text" />}
          color="bg-success-bg"
          iconRounded="rounded-lg"
          compact
        />
        <StatCard
          title="Paralisadas"
          value={stats.paralisadas.toString()}
          subtitle="aguardando retomada"
          icon={<PauseCircle size={18} className="text-danger-text" />}
          color="bg-danger-bg"
          iconRounded="rounded-lg"
          compact
        />

        {/* Card clicável — Execução Financeira */}
        <button
          onClick={() => setShowModal(true)}
          className="col-span-2 lg:col-span-1 group bg-surface border border-border rounded-xl px-3 py-2.5 hover:shadow-md hover:border-primary-200 transition-all text-left cursor-pointer flex items-center gap-3"
        >
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary-200 transition-colors">
            <BarChart3 size={16} className="text-primary-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-text-muted leading-none">Execução Financeira</p>
            <p className={`text-base font-bold leading-tight mt-0.5 ${textColor}`}>{x}%</p>
            <div className="mt-1 h-1 bg-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${Math.min(execucaoPercent, 100)}%` }}
              />
            </div>
          </div>
          <ChevronRight size={14} className="text-text-muted shrink-0 group-hover:text-primary-500 transition-colors" />
        </button>
      </div>

      {showModal && (
        <FinanceiroModal
          stats={stats}
          formatCurrency={formatCurrency}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
