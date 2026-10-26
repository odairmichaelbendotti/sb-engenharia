import type { OrdemServico } from "../../../types/ordem-servico";
import type { FaseEmissao } from "../../../types/tramitacao";
import type { BadgeTone } from "../../components/ui";

// Espelha backend/src/domain/tramitacao/ciencia.ts (mudou lá, mudar aqui). Na lista a fase é
// calculada no navegador; no modal vale a que vem de GET /ordem-servico/:id/tramitacao
export function getFaseEmissao(os: OrdemServico, now: Date = new Date()): FaseEmissao {
  if (os.cienciaDispensada || !os.emitidaEm || !os.cienciaPrazoAte) return "DISPENSADA";
  if (!os.cienteEm) {
    const vencida = os.status === "ATIVO" && now.getTime() > new Date(os.cienciaPrazoAte).getTime();
    return vencida ? "CIENCIA_VENCIDA" : "AGUARDANDO_CIENCIA";
  }
  if (os.contestacoesAbertas > 0) return "EM_CONTESTACAO";
  return "EFETIVADA";
}

export const FASE_LABEL: Record<FaseEmissao, string> = {
  DISPENSADA: "Ciência dispensada",
  AGUARDANDO_CIENCIA: "Aguardando ciência",
  CIENCIA_VENCIDA: "Ciência vencida",
  EM_CONTESTACAO: "Em contestação",
  EFETIVADA: "Ciente",
};

export const FASE_TONE: Record<FaseEmissao, BadgeTone> = {
  DISPENSADA: "neutral",
  AGUARDANDO_CIENCIA: "warning",
  CIENCIA_VENCIDA: "danger",
  EM_CONTESTACAO: "warning",
  EFETIVADA: "success",
};

/** "1 dia e 3 h", "5 h", "40 min": tempo até o prazo, para avisos curtos. */
export function formatTempoRestante(ms: number): string {
  const minutos = Math.max(0, Math.floor(ms / 60_000));
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `${horas} h`;
  const dias = Math.floor(horas / 24);
  const resto = horas % 24;
  return `${dias} ${dias === 1 ? "dia" : "dias"}${resto ? ` e ${resto} h` : ""}`;
}

/** Texto curto do prazo de ciência ("faltam 5 h" / "vencido há 1 dia"). */
export function describePrazoCiencia(prazoAte: string, now: Date = new Date()): string {
  const diff = new Date(prazoAte).getTime() - now.getTime();
  return diff >= 0 ? `faltam ${formatTempoRestante(diff)}` : `vencido há ${formatTempoRestante(-diff)}`;
}
