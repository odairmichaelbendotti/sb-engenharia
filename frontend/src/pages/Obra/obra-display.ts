import type { Obra, ObraStatus } from "../../../types/obra";
import { getBalance } from "../OrdemServico/ordem-servico-balance";

const DAY_MS = 24 * 60 * 60 * 1000;

// Abaixo deste número de dias até a previsão de término a obra é sinalizada como "vencendo"
const DUE_SOON_DAYS = 30;

export const OBRA_STATUS: Record<ObraStatus, { label: string; dot: string; text: string; badge: string }> = {
  EM_ANDAMENTO: {
    label: "Em andamento",
    dot: "bg-warning-text",
    text: "text-warning-text",
    badge: "bg-warning-bg text-warning-text border-warning-border",
  },
  CONCLUIDA: {
    label: "Concluída",
    dot: "bg-success-text",
    text: "text-success-text",
    badge: "bg-success-bg text-success-text border-success-border",
  },
  PARALISADA: {
    label: "Paralisada",
    dot: "bg-danger-text",
    text: "text-danger-text",
    badge: "bg-danger-bg text-danger-text border-danger-border",
  },
  CANCELADA: {
    label: "Cancelada",
    dot: "bg-text-muted",
    text: "text-text-muted",
    badge: "bg-surface-muted text-text-secondary border-border",
  },
};

export const OBRA_TIPO_LABEL: Record<string, string> = {
  CONSTRUCAO: "Construção",
  REFORMA: "Reforma",
  AMPLIACAO: "Ampliação",
  PAVIMENTACAO: "Pavimentação",
  SANEAMENTO: "Saneamento",
  MANUTENCAO_PREDIAL: "Manutenção predial",
  OUTRO: "Outro",
};

// Datas sem horário chegam como meia-noite UTC; "hoje" também em UTC para a diferença em dias
function daysUntil(date: string): number {
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(date);
  const target = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.round((target - today) / DAY_MS);
}

// Obra em andamento com a previsão de término já passada e execução abaixo do orçamento
export function isObraOverdue(obra: Pick<Obra, "status" | "dataPrevisaoTermino" | "valor" | "valorExecutado">) {
  if (obra.status !== "EM_ANDAMENTO" || !obra.dataPrevisaoTermino) return false;
  return daysUntil(obra.dataPrevisaoTermino) < 0 && obra.valorExecutado < obra.valor;
}

// Saldo da obra: soma do que falta liquidar nas OS ativas. "Paga" quando nenhuma OS
// não cancelada tem saldo (quitada ou já finalizada) — aí a obra pode ser concluída
export type ObraBalance = {
  kind: "open" | "empty" | "paid" | "concluded" | "inactive";
  saldo: number;
  percent: number;
  osQuitadas: number;
};

export function getObraBalance(
  obra: Pick<Obra, "status" | "dataConclusao" | "valor" | "valorExecutado" | "ordensServico">,
): ObraBalance {
  const ordens = obra.ordensServico.filter((os) => os.status !== "CANCELADO");
  const ativas = ordens.filter((os) => os.status === "ATIVO");
  const saldo = ativas.reduce((acc, os) => acc + getBalance(os.valor, os.valorExecutado).saldo, 0);
  const percent = obra.valor > 0 ? Math.round((obra.valorExecutado / obra.valor) * 100) : 0;
  const osQuitadas = ordens.filter((os) => os.status !== "ATIVO" || getBalance(os.valor, os.valorExecutado).saldo === 0)
    .length;

  const base = { saldo, percent, osQuitadas };
  if (obra.status === "CONCLUIDA" || obra.dataConclusao) return { kind: "concluded", ...base };
  if (obra.status === "CANCELADA") return { kind: "inactive", ...base };
  if (ordens.length > 0 && osQuitadas === ordens.length) return { kind: "paid", ...base };
  if (obra.valorExecutado === 0) return { kind: "empty", ...base };
  return { kind: "open", ...base };
}

// Aviso de prazo da obra em andamento (prazo = maior previsão de término entre as OS)
export function getObraDeadlineHint(obra: Pick<Obra, "status" | "dataPrevisaoTermino">) {
  if (obra.status !== "EM_ANDAMENTO" || !obra.dataPrevisaoTermino) return null;
  const days = daysUntil(obra.dataPrevisaoTermino);
  if (days < 0) {
    return { label: `Atrasada há ${-days} ${days === -1 ? "dia" : "dias"}`, className: "text-danger-text font-medium" };
  }
  if (days <= DUE_SOON_DAYS) {
    return {
      label: days === 0 ? "Vence hoje" : `Faltam ${days} ${days === 1 ? "dia" : "dias"}`,
      className: "text-warning-text font-medium",
    };
  }
  return null;
}
