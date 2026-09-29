import {
  digitsOnly,
  normalizeCode,
  normalizeEmail,
  normalizeEmpenhoNumero,
  normalizeFreeText,
  normalizeMultilineText,
  normalizeProperName,
  normalizeUf,
  normalizeUpperName,
} from "./text-normalizers.js";

type Normalizer = (value: string) => string;
export type InputRules = Record<string, Normalizer>;

/**
 * Aplica as regras só aos campos de texto presentes — serve tanto para criação
 * quanto para edição parcial. Campos fora das regras passam intactos.
 */
export function normalizeInput<T extends object>(data: T, rules: InputRules): T {
  const normalized = { ...data } as Record<string, unknown>;
  for (const [field, normalize] of Object.entries(rules)) {
    const value = normalized[field];
    if (typeof value === "string") normalized[field] = normalize(value);
  }
  return normalized as T;
}

// Regras por entidade — o que é gravado no banco sai sempre neste formato

export const COMPANY_RULES: InputRules = {
  name: normalizeUpperName,
  cnpj: digitsOnly,
  cep: digitsOnly,
  phone: digitsOnly,
  city: normalizeProperName,
  state: normalizeUf,
  address: normalizeFreeText,
  email: normalizeEmail,
};

export const TENANT_RULES: InputRules = {
  name: normalizeFreeText,
  apelido: normalizeCode,
  cnpj: digitsOnly,
  cep: digitsOnly,
  phone: digitsOnly,
  city: normalizeProperName,
  state: normalizeUf,
  address: normalizeFreeText,
  email: normalizeEmail,
};

export const USER_RULES: InputRules = {
  name: normalizeProperName,
  email: normalizeEmail,
};

export const CONTRATO_RULES: InputRules = {
  identificador: normalizeCode,
  descricaoCurta: normalizeFreeText,
};

export const EMPENHO_RULES: InputRules = {
  numero: normalizeEmpenhoNumero,
  description: normalizeFreeText,
};

export const ORDEM_SERVICO_RULES: InputRules = {
  numero: normalizeCode,
};

export const INVOICE_RULES: InputRules = {
  numero: normalizeCode,
  description: normalizeFreeText,
};

export const OBRA_RULES: InputRules = {
  nome: normalizeFreeText,
  identificacaoPatrimonial: normalizeCode,
  descricao: normalizeMultilineText,
  responsavelTecnico: normalizeProperName,
  anotacoes: normalizeMultilineText,
};
