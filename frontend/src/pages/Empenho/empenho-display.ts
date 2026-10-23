import type { EmpenhoCategory } from "../../../types/empenho";

// Categorias do empenho, na ordem do formulário
export const EMPENHO_CATEGORY_OPTIONS: { value: EmpenhoCategory; label: string }[] = [
  { value: "MANUTENCAO_PREDIAL", label: "Manutenção Predial" },
  { value: "ALIMENTACAO", label: "Alimentação" },
  { value: "HOSPITALAR", label: "Hospitalar" },
  { value: "COMBUSTIVEL", label: "Combustível" },
  { value: "TECNOLOGIA", label: "Tecnologia" },
  { value: "LIMPEZA_CONSERVACAO", label: "Limpeza e Conservação" },
  { value: "SEGURANCA_VIGILANCIA", label: "Segurança e Vigilância" },
  { value: "OUTROS", label: "Outros" },
];

export const EMPENHO_CATEGORY_LABEL = Object.fromEntries(
  EMPENHO_CATEGORY_OPTIONS.map((c) => [c.value, c.label]),
) as Record<EmpenhoCategory, string>;
