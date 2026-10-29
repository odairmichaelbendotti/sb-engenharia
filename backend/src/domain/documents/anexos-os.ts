import { DomainError } from "../errors/DomainError.js";

// Anexos que a OS costuma levar; o usuário marca quais vão no processo
export type AnexoPadraoCodigo =
  | "PLANILHA_SINTETICA"
  | "PLANILHA_ANALITICA"
  | "CRONOGRAMA"
  | "PREMISSAS_TECNICAS"
  | "PRODUTIVIDADE_SINAPI"
  | "OBSERVACOES_TECNICAS";

export const ANEXOS_PADRAO: readonly { codigo: AnexoPadraoCodigo; titulo: string }[] = [
  { codigo: "PLANILHA_SINTETICA", titulo: "Planilha Orçamentária Sintética" },
  { codigo: "PLANILHA_ANALITICA", titulo: "Planilha Orçamentária Analítica" },
  { codigo: "CRONOGRAMA", titulo: "Cronograma Físico-Financeiro" },
  { codigo: "PREMISSAS_TECNICAS", titulo: "Premissas Técnicas" },
  { codigo: "PRODUTIVIDADE_SINAPI", titulo: "Produtividade (SINAPI)" },
  { codigo: "OBSERVACOES_TECNICAS", titulo: "Observações Técnicas para Execução" },
];

// Anexo escolhido para a OS: um da lista padrão (codigo) ou outro, só com título (codigo null)
export type AnexoOs = { codigo: AnexoPadraoCodigo | null; titulo: string; observacao: string | null };

export const MAX_ANEXOS = 30;
export const MAX_TITULO_ANEXO = 150;
export const MAX_OBSERVACAO_ANEXO = 500;
export const MAX_COMENTARIOS_TECNICOS = 50;
export const MAX_COMENTARIO_TECNICO = 1000;

const CODIGOS = new Set<string>(ANEXOS_PADRAO.map((a) => a.codigo));

// Texto da lista começa com maiúscula ("projeto de SPDA" → "Projeto de SPDA")
function inicialMaiuscula(texto: string): string {
  return texto.charAt(0).toLocaleUpperCase("pt-BR") + texto.slice(1);
}

/** Os seis anexos padrão, sem observação: o que vale para a OS anterior à escolha (coluna nula). */
export function anexosPadrao(): AnexoOs[] {
  return ANEXOS_PADRAO.map((a) => ({ codigo: a.codigo, titulo: a.titulo, observacao: null }));
}

/** Anexos que a OS leva: os escolhidos, ou os seis padrão quando nunca foram escolhidos (null). */
export function anexosDaOs(anexos: AnexoOs[] | null): AnexoOs[] {
  return anexos ?? anexosPadrao();
}

/**
 * Lê e valida os anexos enviados pela API (ausente = undefined, mantém o atual na edição).
 * Os padrão ficam na ordem da lista e com o título dela; os outros vêm depois, na ordem enviada.
 * Os textos chegam já limpos; `normalizar` padroniza título e observação (texto livre).
 */
export function parseAnexos(value: unknown, normalizar: (texto: string) => string): AnexoOs[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new DomainError("Anexos must be a list");
  if (value.length > MAX_ANEXOS) throw new DomainError(`A OS aceita no máximo ${MAX_ANEXOS} anexos.`);

  const padrao = new Map<AnexoPadraoCodigo, AnexoOs>();
  const outros: AnexoOs[] = [];
  for (const raw of value as Record<string, unknown>[]) {
    const codigo = raw?.codigo ? String(raw.codigo) : null;
    const observacao = inicialMaiuscula(normalizar(String(raw?.observacao ?? "").trim())) || null;
    if (observacao && observacao.length > MAX_OBSERVACAO_ANEXO) {
      throw new DomainError(`A observação do anexo passa de ${MAX_OBSERVACAO_ANEXO} caracteres.`);
    }
    if (codigo !== null) {
      if (!CODIGOS.has(codigo)) throw new DomainError("Anexo inválido");
      const tipo = codigo as AnexoPadraoCodigo;
      if (padrao.has(tipo)) throw new DomainError("O mesmo anexo foi marcado duas vezes.");
      padrao.set(tipo, { codigo: tipo, titulo: "", observacao });
      continue;
    }
    const titulo = inicialMaiuscula(normalizar(String(raw?.titulo ?? "").trim()));
    if (!titulo) throw new DomainError("Informe o nome de cada anexo adicionado.");
    if (titulo.length > MAX_TITULO_ANEXO) {
      throw new DomainError(`O nome do anexo passa de ${MAX_TITULO_ANEXO} caracteres.`);
    }
    outros.push({ codigo: null, titulo, observacao });
  }

  const escolhidosPadrao = ANEXOS_PADRAO.filter((a) => padrao.has(a.codigo)).map((a) => ({
    ...padrao.get(a.codigo)!,
    titulo: a.titulo,
  }));
  return [...escolhidosPadrao, ...outros];
}

/** Lê a coluna JSON gravada (null = OS anterior à escolha dos anexos). */
export function anexosFromDb(value: unknown): AnexoOs[] | null {
  if (!Array.isArray(value)) return null;
  return (value as Record<string, unknown>[]).map((a) => ({
    codigo: CODIGOS.has(String(a.codigo)) ? (a.codigo as AnexoPadraoCodigo) : null,
    titulo: String(a.titulo ?? ""),
    observacao: a.observacao ? String(a.observacao) : null,
  }));
}

/** Lê e valida os comentários técnicos (ausente = undefined); linhas vazias saem. */
export function parseComentariosTecnicos(value: unknown, normalizar: (texto: string) => string): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new DomainError("Comentários técnicos must be a list");
  const comentarios = value.map((c) => inicialMaiuscula(normalizar(String(c ?? "").trim()))).filter(Boolean);
  if (comentarios.length > MAX_COMENTARIOS_TECNICOS) {
    throw new DomainError(`A OS aceita no máximo ${MAX_COMENTARIOS_TECNICOS} comentários técnicos.`);
  }
  if (comentarios.some((c) => c.length > MAX_COMENTARIO_TECNICO)) {
    throw new DomainError(`Cada comentário técnico aceita no máximo ${MAX_COMENTARIO_TECNICO} caracteres.`);
  }
  return comentarios;
}

/** Chave para comparar anexos (o que reemite a OS quando muda). */
export function anexosKey(anexos: AnexoOs[] | null): string {
  return anexosDaOs(anexos)
    .map((a) => `${a.codigo ?? ""}|${a.titulo}|${a.observacao ?? ""}`)
    .join("\n");
}

const ROMANOS: [number, string][] = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

/** Número romano do anexo (1 → I). */
export function numeroRomano(n: number): string {
  let resto = n;
  let texto = "";
  for (const [valor, simbolo] of ROMANOS) {
    while (resto >= valor) {
      texto += simbolo;
      resto -= valor;
    }
  }
  return texto;
}
