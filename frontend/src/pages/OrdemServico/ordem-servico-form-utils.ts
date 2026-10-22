// Cálculos do formulário da OS, espelhando as regras do backend
// (backend/src/domain/entities/OrdemServico.ts e domain/documents/ordem-servico-document.ts)

const DAY_MS = 24 * 60 * 60 * 1000;

// Prazo de mobilização que vem preenchido na criação da OS
export const DEFAULT_PRAZO_MOBILIZACAO_DIAS = 7;

function arredondar(value: number) {
  return Math.round(value * 100) / 100;
}

export type Orcamento = {
  // Total sem BDI: o total com BDI informado dividido por (1 + BDI)
  totalSemBdi: number;
  // Total com BDI e com o desconto do lote: é o valor final da OS
  valorFinal: number;
};

/** O usuário informa o total com BDI; o total sem BDI e o valor final (com desconto) saem dele. */
export function calcularOrcamento(totalComBdi: number, bdi: number, desconto: number): Orcamento {
  return {
    totalSemBdi: arredondar(totalComBdi / (1 + bdi / 100)),
    valorFinal: arredondar(totalComBdi * (1 - desconto / 100)),
  };
}

/** Data de hoje no fuso local, no formato dos campos de data ("AAAA-MM-DD"). */
export function todayInput() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function parseDay(iso: string) {
  return new Date(`${iso}T00:00:00Z`);
}

/** Término = início + prazo − 1: o dia de início conta como o primeiro dia do prazo. */
export function calcularTermino(dataInicio: string, prazoDias: number): string {
  return new Date(parseDay(dataInicio).getTime() + (prazoDias - 1) * DAY_MS).toISOString().slice(0, 10);
}

/** Prazo em dias de uma OS antiga que só tem início e término (inclui o dia de início). */
export function prazoEntreDatas(dataInicio: string, dataTermino: string): number {
  return Math.round((parseDay(dataTermino).getTime() - parseDay(dataInicio).getTime()) / DAY_MS) + 1;
}

/** "quarta-feira" */
export function diaDaSemana(iso: string): string {
  return parseDay(iso).toLocaleDateString("pt-BR", { weekday: "long", timeZone: "UTC" });
}

/** "2026-10-06" → "06/10/2026" */
export function formatInputDate(iso: string): string {
  return iso.split("-").reverse().join("/");
}
