import type { ObraDetail } from "../../../types/obra";
import { formatCurrency, formatDateOnly } from "../../utils/format-currency";
import { dateOnlyUtc, todayUtc } from "./obra-detail-utils";

const MONTH_FORMAT = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" });
const TICKS = 4;

type Row = {
  label: string;
  start: number;
  end: number;
  barClassName: string;
  // Atraso: faixa tracejada entre a previsão e hoje
  overdueUntil?: number;
};

/**
 * Cronograma comparativo: contrato, empenho e obra no mesmo eixo de tempo,
 * com marcador de hoje — evidencia que o prazo da obra (OS) é diferente do empenho.
 */
export function ObraTimeline({ detail }: { detail: ObraDetail }) {
  const { obra, empenhos, contrato, financial } = detail;
  const today = todayUtc();

  const obraEnd = dateOnlyUtc(obra.dataConclusao ?? obra.dataPrevisaoTermino);
  const obraOverdue = !obra.dataConclusao && obra.status !== "CANCELADA" && today > obraEnd;

  const rows: Row[] = [
    {
      label: "Contrato",
      start: dateOnlyUtc(contrato.dataInicio),
      end: dateOnlyUtc(contrato.dataFim),
      barClassName: "bg-primary-200",
    },
    // Uma faixa por empenho que financia a OS
    ...empenhos.map((empenho, index) => ({
      label: empenhos.length > 1 ? `Empenho ${index + 1}` : "Empenho",
      start: dateOnlyUtc(empenho.startAt),
      end: dateOnlyUtc(empenho.endAt),
      barClassName: "bg-primary-400",
    })),
    {
      label: "Obra (OS)",
      start: dateOnlyUtc(obra.dataInicio),
      end: obraEnd,
      barClassName: obra.dataConclusao ? "bg-secondary-500" : "bg-accent-500",
      ...(obraOverdue ? { overdueUntil: today } : {}),
    },
  ];

  const invoiceDates = (financial?.invoices ?? [])
    .filter((invoice) => invoice.status !== "CANCELADO")
    .map((invoice) => ({ ...invoice, at: dateOnlyUtc(invoice.vencimento) }));

  const min = Math.min(...rows.map((r) => r.start), today);
  const max = Math.max(...rows.map((r) => r.overdueUntil ?? r.end), today, ...invoiceDates.map((i) => i.at));
  const span = Math.max(max - min, 1);
  const pos = (t: number) => ((t - min) / span) * 100;

  const ticks = Array.from({ length: TICKS + 1 }, (_, i) => min + (span * i) / TICKS);

  return (
    <div>
      <div className="relative">
        {/* Marcador de hoje atravessa todas as faixas */}
        <div className="absolute inset-y-0 left-20 right-0 pointer-events-none">
          <div className="absolute inset-y-0 w-px bg-danger-text/70" style={{ left: `${pos(today)}%` }}>
            <span className="absolute -top-4 -translate-x-1/2 text-[9.5px] font-bold text-danger-text whitespace-nowrap">
              hoje
            </span>
          </div>
        </div>

        <div className="space-y-2.5 pt-4">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center gap-2">
              <span className="w-18 shrink-0 text-[11px] font-semibold text-text-secondary">{row.label}</span>
              <div className="relative flex-1 h-3.5 rounded-full bg-surface-muted">
                <div
                  className={`absolute inset-y-0 rounded-full ${row.barClassName}`}
                  style={{ left: `${pos(row.start)}%`, width: `${Math.max(pos(row.end) - pos(row.start), 1)}%` }}
                  title={`${formatDateOnly(new Date(row.start).toISOString())} → ${formatDateOnly(new Date(row.end).toISOString())}`}
                />
                {row.overdueUntil && (
                  <div
                    className="absolute inset-y-0 rounded-r-full border border-dashed border-danger-text bg-danger-bg"
                    style={{ left: `${pos(row.end)}%`, width: `${Math.max(pos(row.overdueUntil) - pos(row.end), 1)}%` }}
                    title="Atraso em relação à previsão de término"
                  />
                )}
              </div>
            </div>
          ))}

          {financial && (
            <div className="flex items-center gap-2">
              <span className="w-18 shrink-0 text-[11px] font-semibold text-text-secondary">Notas fiscais</span>
              <div className="relative flex-1 h-3.5">
                <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
                {invoiceDates.map((invoice) => (
                  <span
                    key={invoice.id}
                    className="absolute top-1/2 w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-secondary-500 border border-surface"
                    style={{ left: `${pos(invoice.at)}%` }}
                    title={`NF ${invoice.numero} · ${formatDateOnly(invoice.vencimento)} · ${formatCurrency(invoice.value)}`}
                  />
                ))}
                {invoiceDates.length === 0 && (
                  <span className="absolute inset-0 flex items-center text-[10.5px] text-text-muted">nenhuma emitida</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <span className="w-18 shrink-0" />
        <div className="relative flex-1 h-4">
          {ticks.map((t, i) => (
            <span
              key={t}
              className={`absolute text-[10px] text-text-muted whitespace-nowrap ${
                i === 0 ? "" : i === TICKS ? "-translate-x-full" : "-translate-x-1/2"
              }`}
              style={{ left: `${(i / TICKS) * 100}%` }}
            >
              {MONTH_FORMAT.format(new Date(t))}
            </span>
          ))}
        </div>
      </div>

      {obraOverdue && (
        <p className="mt-3 flex items-center gap-2 text-[11px] text-danger-text">
          <span className="w-4 h-2.5 rounded-sm border border-dashed border-danger-text bg-danger-bg" />
          Obra além da previsão de término
        </p>
      )}
    </div>
  );
}
