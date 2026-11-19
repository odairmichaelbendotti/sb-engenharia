export type TipoFiscal = "TECNICO" | "ADMINISTRATIVO";
export const TIPOS: Record<TipoFiscal, string> = { TECNICO: "Técnico", ADMINISTRATIVO: "Administrativo" };
export type Designacao = {
  id: string; fiscal_id: string; tipo: TipoFiscal; nome: string; ramal: string; email: string;
  ativo: boolean; inicio: string; fim: string | null; contrato_id: string;
  contrato: { id: string; identificador: string };
};
export type Fiscal = {
  id: string; nome: string; email: string; ramal: string; ativo: boolean; vinculos: Designacao[];
};
export type FiscalizacaoData = {
  tenant_id: string;
  unidades: { id: string; name: string }[];
  fiscais: Fiscal[];
  contratos: { id: string; identificador: string; status: string }[];
  ordens: { id: string; numero: string; status: string; fiscalTecnico_id: string | null; fiscalAdministrativo_id: string | null; empenho: { contrato_id: string } }[];
  historico: { id: string; acao: string; autorNome: string; autorPerfil: string; motivo: string; vigencia: string; createdAt: string;
    contrato_id: string | null; fiscal_id: string | null; dados: Record<string, unknown> }[];
};
export const hoje = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
export const dataCurta = (data: string) => data.slice(0, 10).split("-").reverse().join("/");
