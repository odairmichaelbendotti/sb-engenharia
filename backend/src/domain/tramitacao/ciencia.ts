import type { OrdemServicoStatusValue } from "../entities/OrdemServico.js";

// A empresa tem 48 horas corridas, contadas da emissão no servidor, para dar ciência da OS
export const CIENCIA_PRAZO_HORAS = 48;

const HOUR_MS = 60 * 60 * 1000;

// Limite de tamanho dos textos da tramitação (comentários, apontamentos, respostas)
export const TRAMITACAO_TEXTO_MAX = 4000;

export type FaseEmissao =
  // Criada e ainda não emitida (sem orçamento): a empresa não vê
  | "AGUARDANDO_EMISSAO"
  // OS anterior à regra: não exige ciência
  | "DISPENSADA"
  | "AGUARDANDO_CIENCIA"
  // Prazo vencido sem ciência: a empresa fica travada até dar ciência
  | "CIENCIA_VENCIDA"
  // Ciente, mas com apontamento da empresa ainda sem decisão
  | "EM_CONTESTACAO"
  | "EFETIVADA";

export type SituacaoCiencia = {
  status: OrdemServicoStatusValue;
  // Sem emissão ainda; ausente conta como false
  aguardandoEmissao?: boolean;
  emitidaEm: Date | null;
  cienciaPrazoAte: Date | null;
  cienciaDispensada: boolean;
  cienteEm: Date | null;
  contestacoesAbertas: number;
};

export function calcularPrazoCiencia(emitidaEm: Date): Date {
  return new Date(emitidaEm.getTime() + CIENCIA_PRAZO_HORAS * HOUR_MS);
}

/**
 * OS sem emissão registrada não exige ciência: a anterior à regra, a gravada pelo código antigo e a
 * que ainda aguarda emissão (essa ganha a fase própria em getFaseEmissao).
 */
export function isCienciaDispensada(os: SituacaoCiencia): boolean {
  return os.cienciaDispensada || !os.emitidaEm || !os.cienciaPrazoAte;
}

/** Só OS ativa cobra ciência: cancelada ou finalizada não trava a empresa. */
export function isAguardandoCiencia(os: SituacaoCiencia): boolean {
  return !isCienciaDispensada(os) && os.status === "ATIVO" && !os.cienteEm;
}

/** O prazo vence no instante `cienciaPrazoAte`: até ele (inclusive) a empresa ainda está no prazo. */
export function isCienciaVencida(os: SituacaoCiencia, now: Date): boolean {
  return isAguardandoCiencia(os) && now.getTime() > os.cienciaPrazoAte!.getTime();
}

export function getFaseEmissao(os: SituacaoCiencia, now: Date): FaseEmissao {
  if (os.aguardandoEmissao) return "AGUARDANDO_EMISSAO";
  if (isCienciaDispensada(os)) return "DISPENSADA";
  if (!os.cienteEm) return isCienciaVencida(os, now) ? "CIENCIA_VENCIDA" : "AGUARDANDO_CIENCIA";
  if (os.contestacoesAbertas > 0) return "EM_CONTESTACAO";
  return "EFETIVADA";
}

/** Novo apontamento só dentro da janela de ciência da emissão atual (deu ciência ou não). */
export function podeEmpresaContestar(os: SituacaoCiencia, now: Date): boolean {
  return (
    !isCienciaDispensada(os) && os.status === "ATIVO" && now.getTime() <= os.cienciaPrazoAte!.getTime()
  );
}

/** Depois da janela a empresa ainda comenta enquanto houver apontamento sem decisão. */
export function podeEmpresaComentar(os: SituacaoCiencia, now: Date): boolean {
  if (isCienciaDispensada(os) || os.status !== "ATIVO") return false;
  return podeEmpresaContestar(os, now) || os.contestacoesAbertas > 0;
}

/** A fiscalização comenta e decide apontamentos em qualquer OS que tenha tramitação. */
export function podeFiscalizacaoTramitar(os: SituacaoCiencia): boolean {
  return !isCienciaDispensada(os);
}

// Campos que, alterados na edição, reemitem a OS para a empresa (reabrem a ciência)
export type OrdemServicoConteudo = {
  numero: string;
  empenhos: { empenho_id: string; valor: number }[];
  dataInicio: string | null;
  dataPrevisaoTermino: string | null;
  obra_id: string | null;
  lote_id: string | null;
  setorRequisitante: string | null;
  urgencia: string | null;
  dataVistoria: string | null;
  descricaoProblema: string | null;
  dataEmissao: string | null;
  prazoMobilizacaoDias: number;
  prazoDias: number | null;
  // Em centavos, para não comparar ponto flutuante
  totalComBdiCentavos: number | null;
  fiscalSetorial: string | null;
  fiscalTecnico_id: string | null;
  fiscalAdministrativo_id: string | null;
  condicoesEspeciais: string[];
};

function empenhosKey(empenhos: OrdemServicoConteudo["empenhos"]) {
  return empenhos
    .map((e) => `${e.empenho_id}:${Math.round(e.valor * 100)}`)
    .sort()
    .join("|");
}

/** Se a edição mudou algo que a empresa precisa reconhecer de novo. */
export function houveMudancaNoConteudo(antes: OrdemServicoConteudo, depois: OrdemServicoConteudo): boolean {
  const { empenhos: empenhosAntes, condicoesEspeciais: condicoesAntes, ...restoAntes } = antes;
  const { empenhos: empenhosDepois, condicoesEspeciais: condicoesDepois, ...restoDepois } = depois;
  if (empenhosKey(empenhosAntes) !== empenhosKey(empenhosDepois)) return true;
  if (condicoesAntes.join("\n") !== condicoesDepois.join("\n")) return true;
  return (Object.keys(restoAntes) as (keyof typeof restoAntes)[]).some((key) => restoAntes[key] !== restoDepois[key]);
}
