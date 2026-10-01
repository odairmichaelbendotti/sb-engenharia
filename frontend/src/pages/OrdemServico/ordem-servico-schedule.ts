import type { OrdemServico, OrdemServicoObra } from "../../../types/ordem-servico";
import { formatDateOnly } from "../../utils/format-currency";

const DAY_MS = 24 * 60 * 60 * 1000;

// Abaixo deste número de dias até a previsão de término a OS é sinalizada como "vencendo"
export const DUE_SOON_DAYS = 15;

export type ScheduleKind =
  | "overdue"
  | "dueSoon"
  | "paused"
  | "noObra"
  | "noSchedule"
  | "onTrack"
  | "concluded"
  | "inactive";

export type ScheduleTone = "danger" | "warning" | "success" | "neutral";

export type OrdemServicoSchedule = {
  kind: ScheduleKind;
  tone: ScheduleTone;
  label: string;
  // Dias até a previsão de término (negativo = atraso); null quando não se aplica
  daysToDeadline: number | null;
  // Fração decorrida entre início e previsão de término da OS (0 a 1); null sem prazo
  elapsedRatio: number | null;
};

// Rank usado na ordenação por urgência: menor aparece primeiro
export const SCHEDULE_URGENCY: Record<ScheduleKind, number> = {
  overdue: 0,
  dueSoon: 1,
  noObra: 2,
  noSchedule: 2,
  paused: 3,
  onTrack: 4,
  concluded: 5,
  inactive: 6,
};

// Datas sem horário chegam como meia-noite UTC; "hoje" também é normalizado em UTC
// para que a diferença em dias não sofra com o fuso local
function todayUtc(): number {
  const now = new Date();
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
}

function dateOnlyUtc(date: string): number {
  const d = new Date(date);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function plural(n: number, singular: string, pluralForm: string) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

// O mínimo para calcular o prazo: a OS da listagem de OS e a OS dentro de uma obra servem
export type ScheduleInput = Pick<OrdemServico, "status" | "dataInicio" | "dataPrevisaoTermino"> & {
  obra: Pick<OrdemServicoObra, "status" | "dataConclusao"> | null;
};

// O cronograma é da OS (início e previsão de término dela); a obra só entra com o status
export function getOrdemServicoSchedule(os: ScheduleInput): OrdemServicoSchedule {
  const { obra } = os;

  const today = todayUtc();
  const hasSchedule = Boolean(os.dataInicio && os.dataPrevisaoTermino);
  const start = os.dataInicio ? dateOnlyUtc(os.dataInicio) : today;
  const deadline = os.dataPrevisaoTermino ? dateOnlyUtc(os.dataPrevisaoTermino) : today;
  const span = deadline - start;
  const elapsedRatio = !hasSchedule
    ? null
    : span > 0
      ? Math.min(1, Math.max(0, (today - start) / span))
      : today >= deadline
        ? 1
        : 0;
  const daysToDeadline = Math.round((deadline - today) / DAY_MS);

  if (!obra) {
    if (os.status !== "ATIVO") {
      return { kind: "inactive", tone: "neutral", label: "Sem obra", daysToDeadline: null, elapsedRatio: null };
    }
    return {
      kind: "noObra",
      tone: "warning",
      label: "Sem obra vinculada",
      daysToDeadline: null,
      elapsedRatio,
    };
  }

  if (obra.dataConclusao || obra.status === "CONCLUIDA") {
    return {
      kind: "concluded",
      tone: "success",
      label: obra.dataConclusao ? `Concluída em ${formatDateOnly(obra.dataConclusao)}` : "Obra concluída",
      daysToDeadline: null,
      elapsedRatio: 1,
    };
  }

  if (os.status === "CANCELADO") {
    return { kind: "inactive", tone: "neutral", label: "OS cancelada", daysToDeadline: null, elapsedRatio };
  }
  if (os.status === "FINALIZADO") {
    return { kind: "inactive", tone: "neutral", label: "OS finalizada", daysToDeadline: null, elapsedRatio };
  }

  if (obra.status === "PARALISADA") {
    return {
      kind: "paused",
      tone: "warning",
      label: "Obra paralisada",
      daysToDeadline: hasSchedule ? daysToDeadline : null,
      elapsedRatio,
    };
  }
  if (obra.status === "CANCELADA") {
    return { kind: "inactive", tone: "neutral", label: "Obra cancelada", daysToDeadline: null, elapsedRatio };
  }

  if (!hasSchedule) {
    return { kind: "noSchedule", tone: "warning", label: "Sem prazo definido", daysToDeadline: null, elapsedRatio };
  }

  if (daysToDeadline < 0) {
    return {
      kind: "overdue",
      tone: "danger",
      label: `Atrasada há ${plural(-daysToDeadline, "dia", "dias")}`,
      daysToDeadline,
      elapsedRatio,
    };
  }
  if (daysToDeadline <= DUE_SOON_DAYS) {
    return {
      kind: "dueSoon",
      tone: "warning",
      label: daysToDeadline === 0 ? "Vence hoje" : `Vence em ${plural(daysToDeadline, "dia", "dias")}`,
      daysToDeadline,
      elapsedRatio,
    };
  }
  return {
    kind: "onTrack",
    tone: "success",
    label: `Faltam ${plural(daysToDeadline, "dia", "dias")}`,
    daysToDeadline,
    elapsedRatio,
  };
}

// Número da OS no formato "01/BAFL/2026": ordena por ano e depois pela sequência
export function compareNumero(a: string, b: string): number {
  const parse = (n: string) => {
    const parts = n.split("/");
    const seq = parseInt(parts[0] ?? "", 10);
    const year = parseInt(parts[parts.length - 1] ?? "", 10);
    return { seq: Number.isNaN(seq) ? 0 : seq, year: Number.isNaN(year) ? 0 : year };
  };
  const pa = parse(a);
  const pb = parse(b);
  return pb.year - pa.year || pb.seq - pa.seq || a.localeCompare(b);
}
