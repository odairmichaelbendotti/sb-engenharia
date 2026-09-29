import { KNOWN_ACRONYMS } from "./acronyms.js";

const LOCALE = "pt-BR";

// Caracteres invisíveis que costumam vir de copiar/colar (Word, PDF, WhatsApp)
const INVISIBLE_CHARS = /[\u200B-\u200D\u2060\uFEFF\u00AD]/g;

// Preposições/conjunções que ficam minúsculas em nomes próprios
const NAME_PARTICLES = new Set(["da", "das", "de", "do", "dos", "e", "di", "du"]);

/** Limpeza comum a todo texto de uma linha: acentos unificados, sem invisíveis e espaços únicos. */
export function cleanText(value: string): string {
  return value
    .normalize("NFC")
    .replace(INVISIBLE_CHARS, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Mesma limpeza, preservando quebras de linha (máximo de uma linha em branco seguida). */
export function cleanMultilineText(value: string): string {
  return value
    .normalize("NFC")
    .replace(INVISIBLE_CHARS, "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Códigos (nº de OS, NF, contrato, patrimônio): maiúsculas e sem espaço em volta de / - . */
export function normalizeCode(value: string): string {
  return cleanText(value)
    .toLocaleUpperCase(LOCALE)
    .replace(/\s*([/\-.])\s*/g, "$1");
}

/** Nº do empenho segue o padrão do SIAFI, sem espaço nenhum: 2026 ne 000606 → 2026NE000606. */
export function normalizeEmpenhoNumero(value: string): string {
  return normalizeCode(value).replace(/\s/g, "");
}

/** Razão social: tudo em maiúsculas, como no cartão CNPJ da Receita. */
export function normalizeUpperName(value: string): string {
  return cleanText(value).toLocaleUpperCase(LOCALE);
}

function capitalize(word: string): string {
  return word.charAt(0).toLocaleUpperCase(LOCALE) + word.slice(1);
}

/** Nomes de pessoas e cidades: JOÃO DA SILVA → João da Silva, são JOSÉ → São José. */
export function normalizeProperName(value: string): string {
  return cleanText(value)
    .toLocaleLowerCase(LOCALE)
    .split(" ")
    .map((word, index) =>
      index > 0 && NAME_PARTICLES.has(word) ? word : word.split("-").map(capitalize).join("-"),
    )
    .join(" ");
}

function isShouting(text: string): boolean {
  const letters = text.replace(/[^\p{L}]/gu, "");
  const wordsWithLetters = text.split(/\s+/).filter((word) => /\p{L}/u.test(word));
  return (
    wordsWithLetters.length >= 2 &&
    letters === letters.toLocaleUpperCase(LOCALE) &&
    letters !== letters.toLocaleLowerCase(LOCALE)
  );
}

function toSentenceCase(text: string): string {
  const lowered = text.replace(/[\p{L}\p{N}]+/gu, (word) =>
    KNOWN_ACRONYMS.has(word) || /\d/.test(word) ? word : word.toLocaleLowerCase(LOCALE),
  );
  // Maiúscula no início do texto, de cada frase e de cada linha
  return lowered.replace(
    /(^|[.!?]\s+|\n\s*)(\p{Ll})/gu,
    (_match, prefix: string, letter: string) => prefix + letter.toLocaleUpperCase(LOCALE),
  );
}

/**
 * Texto livre (descrições, nome da obra, anotações): só limpeza. Se vier todo em
 * maiúsculas, vira frase normal preservando siglas conhecidas e termos com dígito.
 */
export function normalizeFreeText(value: string, { multiline = false } = {}): string {
  const cleaned = multiline ? cleanMultilineText(value) : cleanText(value);
  return isShouting(cleaned) ? toSentenceCase(cleaned) : cleaned;
}

export function normalizeMultilineText(value: string): string {
  return normalizeFreeText(value, { multiline: true });
}

/** CNPJ, CEP e telefone: só dígitos no banco; a máscara é aplicada na tela. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeEmail(value: string): string {
  return cleanText(value).replace(/\s/g, "").toLocaleLowerCase(LOCALE);
}

export function normalizeUf(value: string): string {
  return cleanText(value).toLocaleUpperCase(LOCALE);
}
