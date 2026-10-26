import type { StatusTone } from "../components/ui/StatusPill";

/**
 * Rótulo e tom do selo de status de cada entidade, num lugar só (StatusPill).
 * Regra da paleta "Grafite e sinal" (2026-10-26): o estado normal (ativo, em andamento) é grafite
 * (active); âmbar só para o que vence em breve ou aguarda alguém; vermelho só para o que já passou;
 * verde para pago/concluído; selo vazado para o que foi encerrado (closed: finalizado, cancelado).
 */
export type StatusDisplay = { label: string; tone: StatusTone; title?: string };

const DAY_MS = 24 * 60 * 60 * 1000;

// Datas sem horário chegam como meia-noite UTC; "hoje" também em UTC para a diferença em dias
export function daysUntilDateOnly(date: string | Date): number {
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(date);
  const target = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.round((target - today) / DAY_MS);
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export type HintTone = "muted" | "warning" | "danger" | "success";

export type DeadlineHint = { label: string; tone: HintTone; days: number };

/**
 * Dica de prazo para uma data final (vigência, vencimento): "faltam 52 dias", "vence em 10 dias",
 * "venceu há 3 dias". `active` = ainda corre (registro ativo); encerrado não ganha dica.
 */
export function getDeadlineHint(
  date: string | Date | null | undefined,
  { active = true, dueSoonDays = 30 }: { active?: boolean; dueSoonDays?: number } = {},
): DeadlineHint | null {
  if (!date || !active) return null;
  const days = daysUntilDateOnly(date);
  if (days < 0) return { label: `venceu há ${plural(-days, "dia", "dias")}`, tone: "danger", days };
  if (days === 0) return { label: "vence hoje", tone: "warning", days };
  if (days <= dueSoonDays) return { label: `vence em ${plural(days, "dia", "dias")}`, tone: "warning", days };
  return { label: `faltam ${plural(days, "dia", "dias")}`, tone: "muted", days };
}

export const HINT_TEXT: Record<HintTone, string> = {
  muted: "text-text-muted",
  warning: "text-warning-text font-semibold",
  danger: "text-danger-text font-semibold",
  success: "text-success-text font-semibold",
};

// Contrato e empenho têm o mesmo ciclo: ativo, finalizado, cancelado
export function contratoStatusDisplay(status: string, dataFim?: string | Date | null): StatusDisplay {
  const s = status.toUpperCase();
  if (s === "FINALIZADO") return { label: "Finalizado", tone: "closed" };
  if (s === "CANCELADO") return { label: "Cancelado", tone: "closed" };
  const hint = getDeadlineHint(dataFim ?? null);
  if (hint && hint.days < 0) return { label: "Vigência vencida", tone: "danger", title: `Vigência ${hint.label}` };
  return { label: "Ativo", tone: "active" };
}

export const empenhoStatusDisplay = contratoStatusDisplay;

export function invoiceStatusDisplay(status: string | null | undefined): StatusDisplay {
  switch ((status ?? "").toUpperCase()) {
    case "PAGO":
      return { label: "Paga", tone: "success" };
    case "VENCIDO":
      return { label: "Vencida", tone: "danger" };
    case "CANCELADO":
      return { label: "Cancelada", tone: "closed" };
    default:
      return { label: "Pendente", tone: "warning" };
  }
}

export function obraStatusDisplay(status: string, overdue = false): StatusDisplay {
  switch (status) {
    case "CONCLUIDA":
      return { label: "Concluída", tone: "success" };
    case "PARALISADA":
      return { label: "Paralisada", tone: "danger" };
    case "CANCELADA":
      return { label: "Cancelada", tone: "closed" };
    default:
      return overdue
        ? { label: "Em andamento", tone: "danger", title: "Prazo de término vencido" }
        : { label: "Em andamento", tone: "active" };
  }
}

// Rótulo curto da nota fiscal: "NF 1002"; não repete o prefixo quando o número já tem ("NF-1002")
export function invoiceLabel(numero: string): string {
  return /^NF\b/i.test(numero) ? numero : `NF ${numero}`;
}
