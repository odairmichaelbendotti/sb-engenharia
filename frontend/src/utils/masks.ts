export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function maskCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function maskPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function maskCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Máscara guiada de valor monetário (padrão "os dígitos são centavos"): a cada
 * dígito digitado, o valor inteiro é reinterpretado como centavos e reformatado
 * com separador de milhar e 2 casas decimais fixas — não dá pra digitar vírgula/ponto
 * fora de lugar nem deixar menos de 2 casas decimais. Não inclui o prefixo "R$"
 * (os formulários já mostram isso como texto fixo ao lado do input).
 */
export function maskCurrency(value: string): string {
  const digits = onlyDigits(value);
  if (!digits) return "";
  return centsToCurrencyMask(parseInt(digits, 10));
}

/** Converte um valor em reais (ex.: vindo da API) pro mesmo formato que `maskCurrency` produz, pra popular um input controlado por essa máscara ao editar um registro existente. */
export function formatValueToCurrencyMask(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Converte de volta o texto mascarado (ex.: "1.234,56") pro número em reais (1234.56) — inverso de `maskCurrency`/`formatValueToCurrencyMask`. */
export function parseCurrencyMask(value: string): number {
  const digits = onlyDigits(value);
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

function centsToCurrencyMask(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
