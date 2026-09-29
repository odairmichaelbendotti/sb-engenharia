import type { ObraStatus, ObraTipo } from "../../../types/obra";

const DAY_MS = 24 * 60 * 60 * 1000;

export const OBRA_STATUS_LABEL: Record<ObraStatus, string> = {
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  PARALISADA: "Paralisada",
  CANCELADA: "Cancelada",
};

export const OBRA_TIPO_LABEL: Record<ObraTipo, string> = {
  CONSTRUCAO: "Construção",
  REFORMA: "Reforma",
  AMPLIACAO: "Ampliação",
  PAVIMENTACAO: "Pavimentação",
  SANEAMENTO: "Saneamento",
  MANUTENCAO_PREDIAL: "Manutenção Predial",
  OUTRO: "Outro",
};

// Status de OS, empenho e contrato usam os mesmos valores
export const RECORD_STATUS: Record<string, { label: string; className: string }> = {
  ATIVO: { label: "Ativo", className: "bg-warning-bg text-warning-text border-warning-border" },
  FINALIZADO: { label: "Finalizado", className: "bg-success-bg text-success-text border-success-border" },
  CANCELADO: { label: "Cancelado", className: "bg-danger-bg text-danger-text border-danger-border" },
};

export const INVOICE_STATUS: Record<string, { label: string; className: string }> = {
  PENDENTE: { label: "Pendente", className: "bg-warning-bg text-warning-text border-warning-border" },
  PAGO: { label: "Pago", className: "bg-success-bg text-success-text border-success-border" },
  VENCIDO: { label: "Vencido", className: "bg-danger-bg text-danger-text border-danger-border" },
  CANCELADO: { label: "Cancelado", className: "bg-surface-muted text-text-muted border-border" },
};

// Datas sem horário chegam como meia-noite UTC; "hoje" também é normalizado em UTC
// para que a diferença em dias não sofra com o fuso local
export function todayUtc(): number {
  const now = new Date();
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
}

export function dateOnlyUtc(date: string): number {
  const d = new Date(date);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function daysUntil(date: string): number {
  return Math.round((dateOnlyUtc(date) - todayUtc()) / DAY_MS);
}

export function percentOf(part: number, total: number): number {
  return total > 0 ? (part / total) * 100 : 0;
}

export function formatPercent(value: number): string {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

export function plural(n: number, singular: string, pluralForm: string) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}
