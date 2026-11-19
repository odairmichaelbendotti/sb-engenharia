type FiscalDocumento = { nome: string; ramal: string; email: string };
export type FiscaisEmissao = { tecnico: FiscalDocumento | null; administrativo: FiscalDocumento | null };

export function parseFiscaisEmissao(value: unknown): FiscaisEmissao | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const fiscal = (v: unknown): v is FiscalDocumento | null => v === null || (!!v && typeof v === "object"
    && ["nome", "ramal", "email"].every((key) => typeof (v as Record<string, unknown>)[key] === "string"));
  return fiscal(data.tecnico) && fiscal(data.administrativo) ? data as FiscaisEmissao : null;
}
