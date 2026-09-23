import type {
  OrdemServicoEntity,
  OrdemServicoType,
  OrdemServicoStatusValue,
  PersistedOrdemServico,
} from "../entities/OrdemServico.js";

export type OrdemServicoContrato = {
  id: string;
  identificador: string;
  descricaoCurta: string;
  cor: string;
  company: {
    id: string;
    name: string;
    cnpj: string;
  };
};

export type OrdemServicoEmpenhoInfo = {
  id: string;
  numero: string;
  description: string;
  contrato: OrdemServicoContrato;
};

export type OrdemServicoObra = {
  id: string;
  nome: string;
  status: string;
};

export type OrdemServicoListItem = PersistedOrdemServico & {
  empenho: OrdemServicoEmpenhoInfo;
  obra: OrdemServicoObra | null;
};

export type OrdemServicoStats = {
  total: number;
  ativas: number;
  finalizadas: number;
  canceladas: number;
  valorTotal: number;
};

export type ListOrdensServicoResponse = {
  ordensServico: OrdemServicoListItem[];
  stats: OrdemServicoStats;
};

export type OrdemServicoOption = {
  id: string;
  numero: string;
  valor: number;
  empenho: OrdemServicoEmpenhoInfo;
};

export type OrdemServicoActiveCountByTenant = {
  tenant_id: string;
  count: number;
};

export interface IOrdemServicoRepository {
  create(ordemServico: OrdemServicoEntity): Promise<OrdemServicoListItem>;
  verifyNumero(numero: string, tenant_id: string): Promise<boolean>;
  list(tenant_id: string): Promise<ListOrdensServicoResponse>;
  /** Contagem de OS ativas, agrupada por tenant — resumo multi-institucional do PLATFORM_ADMIN. */
  countActiveByTenant(): Promise<OrdemServicoActiveCountByTenant[]>;
  listOptionsForObra(tenant_id: string): Promise<OrdemServicoOption[]>;
  findById(id: string): Promise<PersistedOrdemServico | null>;
  update(id: string, ordemServico: OrdemServicoType): Promise<PersistedOrdemServico>;
  updateStatus(id: string, status: OrdemServicoStatusValue): Promise<PersistedOrdemServico>;
  delete(id: string): Promise<void>;
  hasObraVinculada(id: string): Promise<boolean>;
}
