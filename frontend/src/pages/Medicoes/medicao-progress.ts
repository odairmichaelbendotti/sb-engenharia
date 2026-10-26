// Avanço físico (medido ÷ orçado) comparado com o prazo decorrido da OS. Usado na lista de
// medições e no painel da obra, para a mesma conta valer nos dois lugares

const DIA_MS = 24 * 60 * 60 * 1000;

/** Fração medida do orçamento (0 a 1); null sem orçamento. */
export function fracaoMedida(valorMedido: number, valorOrcado: number): number | null {
  return valorOrcado > 0 ? Math.min(1, valorMedido / valorOrcado) : null;
}

/**
 * Fração do prazo já decorrida (0 a 1). Datas puras (meia-noite UTC); o dia do término conta
 * inteiro. null sem cronograma.
 */
export function fracaoPrazo(dataInicio: string | null, dataFim: string | null, hoje = new Date()): number | null {
  if (!dataInicio || !dataFim) return null;
  const inicio = Date.parse(dataInicio);
  const fim = Date.parse(dataFim) + DIA_MS;
  if (!Number.isFinite(inicio) || !Number.isFinite(fim) || fim <= inicio) return null;
  return Math.min(1, Math.max(0, (hoje.getTime() - inicio) / (fim - inicio)));
}

export type RitmoTone = "neutral" | "warning" | "danger";

export type Ritmo = { tone: RitmoTone; label: string; title: string };

// Quanto o medido pode ficar atrás do prazo antes de virar alerta
const FOLGA_AVISO = 0.1;
const FOLGA_ATRASO = 0.25;

export const percent = (fracao: number) => Math.round(fracao * 100);

/**
 * Compara o medido com o prazo: âmbar quando a medição está um pouco atrás, vermelho quando
 * está muito atrás. Medição adiantada ou no ritmo fica em cinza.
 */
export function ritmoMedicao(medido: number, prazo: number): Ritmo {
  const atraso = prazo - medido;
  const title = `${percent(medido)}% medido com ${percent(prazo)}% do prazo decorrido`;
  if (atraso > FOLGA_ATRASO) return { tone: "danger", label: `${percent(prazo)}% do prazo · atrasada`, title };
  if (atraso > FOLGA_AVISO) return { tone: "warning", label: `${percent(prazo)}% do prazo`, title };
  return { tone: "neutral", label: `${percent(prazo)}% do prazo`, title };
}

/** Busca sem diferenciar acento nem maiúsculas ("reboco" acha "Reboço"). */
export function normalizeSearch(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function matchesItemSearch(item: { codigo: string | null; descricao: string }, busca: string) {
  const termo = normalizeSearch(busca);
  if (!termo) return true;
  return normalizeSearch(`${item.codigo ?? ""} ${item.descricao}`).includes(termo);
}
