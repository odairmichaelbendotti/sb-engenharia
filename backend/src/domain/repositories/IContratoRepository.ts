import type { ContratoEntity, ContratoType, ContratoStatusValue, PersistedContrato } from "../entities/Contrato.js";

export type ContratoCompany = {
  id: string;
  name: string;
  cnpj: string;
};

export type ContratoListItem = PersistedContrato & {
  company: ContratoCompany;
  empenhos: {
    id: string;
    numero: string;
    description: string;
    value: number;
    status: string;
  }[];
  valorEmpenhado: number;
  saldoDisponivel: number;
};

export type ContratoStats = {
  total: number;
  ativos: number;
  finalizados: number;
  cancelados: number;
  valorTotal: number;
};

export type ListContratosResponse = {
  contratos: ContratoListItem[];
  stats: ContratoStats;
};

export type ContratoOptionEmpenho = {
  id: string;
  numero: string;
  description: string;
};

export type ContratoOption = {
  id: string;
  identificador: string;
  descricaoCurta: string;
  cor: string;
  empenhos: ContratoOptionEmpenho[];
};

export type ContratoActiveCountByTenant = {
  tenant_id: string;
  count: number;
};

export interface IContratoRepository {
  create(contrato: ContratoEntity): Promise<ContratoListItem>;
  verifyIdentificador(identificador: string, tenant_id: string): Promise<boolean>;
  list(tenant_id: string): Promise<ListContratosResponse>;
  /** Contagem de contratos ativos, agrupada por tenant — usado no resumo multi-institucional do PLATFORM_ADMIN. */
  countActiveByTenant(): Promise<ContratoActiveCountByTenant[]>;
  listOptionsForObra(tenant_id: string): Promise<ContratoOption[]>;
  findById(id: string): Promise<PersistedContrato | null>;
  update(id: string, contrato: ContratoType): Promise<PersistedContrato>;
  updateStatus(id: string, status: ContratoStatusValue): Promise<PersistedContrato>;
  delete(id: string): Promise<void>;
  /**
   * Saldo disponível do contrato (valor total - soma dos empenhos não cancelados).
   * `excludeEmpenhoId` desconsidera um empenho específico da soma já consumida —
   * usado ao editar/reativar um empenho existente, pra não contar ele contra si mesmo.
   */
  getSaldoDisponivel(contratoId: string, excludeEmpenhoId?: string): Promise<number>;
}
