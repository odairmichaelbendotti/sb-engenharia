import type {
  ContratoEntity,
  ContratoType,
  ContratoStatusValue,
  FiscalContratoRecord,
  LoteRecord,
  PersistedContrato,
} from "../entities/Contrato.js";

export type ContratoCompany = {
  id: string;
  name: string;
  cnpj: string;
};

// Contrato com os lotes e os fiscais que alimentam a Ordem de Serviço
export type ContratoWithOrdemServicoData = PersistedContrato & {
  lotes: LoteRecord[];
  fiscais: FiscalContratoRecord[];
};

export type ContratoListItem = ContratoWithOrdemServicoData & {
  company: ContratoCompany;
  empenhos: {
    id: string;
    numero: string;
    description: string;
    value: number;
    status: string;
  }[];
  valorEmpenhado: number;
  // Saldo a empenhar (valor − empenhos não cancelados) — usado ao criar empenho
  saldoDisponivel: number;
  // Soma das notas fiscais não canceladas dos empenhos do contrato
  valorLiquidado: number;
  // Quanto do contrato ainda falta pagar (valor − liquidado)
  saldoALiquidar: number;
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
  list(tenant_id?: string): Promise<ListContratosResponse>;
  /** Contagem de contratos ativos, agrupada por tenant — usado no resumo multi-institucional do PLATFORM_ADMIN. */
  countActiveByTenant(): Promise<ContratoActiveCountByTenant[]>;
  listOptionsForObra(tenant_id: string): Promise<ContratoOption[]>;
  findById(id: string): Promise<PersistedContrato | null>;
  /** Atualiza o contrato e substitui o conjunto de lotes e de fiscais pelo informado. */
  update(id: string, contrato: ContratoType): Promise<ContratoWithOrdemServicoData>;
  updateStatus(id: string, status: ContratoStatusValue): Promise<PersistedContrato>;
  delete(id: string): Promise<void>;
  /**
   * Saldo disponível do contrato (valor total - soma dos empenhos não cancelados).
   * `excludeEmpenhoId` desconsidera um empenho específico da soma já consumida —
   * usado ao editar/reativar um empenho existente, pra não contar ele contra si mesmo.
   */
  getSaldoDisponivel(contratoId: string, excludeEmpenhoId?: string): Promise<number>;
}
