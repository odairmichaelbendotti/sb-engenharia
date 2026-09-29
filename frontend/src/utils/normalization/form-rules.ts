import type { Dispatch, FocusEvent, SetStateAction } from "react";
import {
  normalizeCode,
  normalizeEmail,
  normalizeEmpenhoNumero,
  normalizeFreeText,
  normalizeMultilineText,
  normalizeProperName,
  normalizeUpperName,
} from "./text-normalizers";

type FieldRules = Record<string, (value: string) => string>;

// Regras por formulário, espelhando backend/src/domain/normalization/input-rules.ts.
// CNPJ, CEP e telefone ficam de fora: na tela eles já têm máscara própria.

export const COMPANY_FIELD_RULES: FieldRules = {
  name: normalizeUpperName,
  city: normalizeProperName,
  address: normalizeFreeText,
  email: normalizeEmail,
};

export const TENANT_FIELD_RULES: FieldRules = {
  name: normalizeFreeText,
  apelido: normalizeCode,
  city: normalizeProperName,
  address: normalizeFreeText,
  email: normalizeEmail,
};

export const CONTRATO_FIELD_RULES: FieldRules = {
  identificador: normalizeCode,
  descricaoCurta: normalizeFreeText,
};

export const EMPENHO_FIELD_RULES: FieldRules = {
  numero: normalizeEmpenhoNumero,
  description: normalizeFreeText,
};

export const ORDEM_SERVICO_FIELD_RULES: FieldRules = {
  numero: normalizeCode,
};

export const INVOICE_FIELD_RULES: FieldRules = {
  numero: normalizeCode,
  description: normalizeFreeText,
};

export const OBRA_FIELD_RULES: FieldRules = {
  nome: normalizeFreeText,
  identificacaoPatrimonial: normalizeCode,
  descricao: normalizeMultilineText,
  responsavelTecnico: normalizeProperName,
  anotacoes: normalizeMultilineText,
};

export const USER_FIELD_RULES: FieldRules = {
  name: normalizeProperName,
  email: normalizeEmail,
};

/**
 * Handler para o `onBlur` do `<form>`: o blur dos campos sobe até o form, e o
 * campo que perdeu o foco (pelo atributo `name`) é padronizado no estado.
 */
export function createBlurNormalizer<T>(setState: Dispatch<SetStateAction<T>>, rules: FieldRules) {
  return (event: FocusEvent<HTMLFormElement>) => {
    const target = event.target as EventTarget & { name?: string; value?: unknown };
    const normalize = target.name ? rules[target.name] : undefined;
    if (!normalize || typeof target.value !== "string") return;
    const field = target.name as string;
    const normalized = normalize(target.value);
    if (normalized === target.value) return;
    setState((prev) => ({ ...prev, [field]: normalized }));
  };
}
