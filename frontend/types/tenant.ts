export interface Tenant {
  id: string;
  name: string;
  apelido: string;
  cnpj: string;
  cep: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantOption {
  id: string;
  name: string;
}

export type TenantSummaryStats = {
  contratosAtivos: number;
  empenhosAtivos: number;
  empenhosAtivosValor: number;
  osAtivas: number;
  obrasEmAndamento: number;
  orcamentoTotal: number;
  valorExecutadoTotal: number;
  notasPendentesVencidasCount: number;
  notasPendentesVencidasValor: number;
};

export interface TenantSummaryEntry {
  tenant: { id: string; name: string };
  stats: TenantSummaryStats;
}
