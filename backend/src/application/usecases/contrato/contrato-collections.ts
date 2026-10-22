import type { FiscalContratoInput, LoteInput } from "../../../domain/entities/Contrato.js";
import { FISCAL_CONTRATO_RULES, LOTE_RULES, normalizeInput } from "../../../domain/normalization/input-rules.js";

// Lotes e fiscais vão aninhados no contrato: padroniza o texto de cada item
export function normalizeLotes(lotes: LoteInput[] | undefined): LoteInput[] {
  return (lotes ?? []).map((lote) => normalizeInput(lote, LOTE_RULES));
}

export function normalizeFiscais(fiscais: FiscalContratoInput[] | undefined): FiscalContratoInput[] {
  return (fiscais ?? []).map((fiscal) => normalizeInput(fiscal, FISCAL_CONTRATO_RULES));
}
