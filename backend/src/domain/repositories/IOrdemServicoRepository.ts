import type {
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

// Empenho vinculado à OS, com o valor destinado a ela
export type OrdemServicoVinculo = {
  empenho_id: string;
  numero: string;
  description: string;
  // Quanto deste empenho vai para a OS
  valor: number;
  // Valor total do empenho
  empenhoValue: number;
};

// Dados já validados para gravar a OS — valores em centavos
export type OrdemServicoPersistData = {
  numero: string;
  tenant_id: string;
  empenhos: { empenho_id: string; valor: number }[];
  dataInicio: Date;
  dataPrevisaoTermino: Date;
  obra_id: string | null;
};

export type OrdemServicoObra = {
  id: string;
  nome: string;
  identificacaoPatrimonial: string;
  tipo: string;
  status: string;
  dataConclusao: Date | null;
  latitude: number | null;
  longitude: number | null;
  responsavelTecnico: string;
};

// Vínculo com a situação financeira: quanto já foi liquidado dele nesta OS e quanto do
// empenho já está destinado a OS não canceladas (para o saldo livre)
export type OrdemServicoVinculoFinanceiro = OrdemServicoVinculo & {
  liquidado: number;
  empenhoComprometido: number;
};

export type OrdemServicoListItem = PersistedOrdemServico & {
  // Empenho principal — por ele se chega ao contrato e à empresa
  empenho: OrdemServicoEmpenhoInfo;
  empenhos: OrdemServicoVinculoFinanceiro[];
  obra: OrdemServicoObra | null;
  // Soma das notas fiscais não canceladas lançadas nesta OS
  valorExecutado: number;
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
  dataInicio: Date | null;
  dataPrevisaoTermino: Date | null;
  empenho: OrdemServicoEmpenhoInfo;
  empenhos: OrdemServicoVinculo[];
};

export type OrdemServicoActiveCountByTenant = {
  tenant_id: string;
  count: number;
};

export interface IOrdemServicoRepository {
  /** Cria a OS com seus vínculos; valor da OS = soma dos vínculos. */
  create(data: OrdemServicoPersistData): Promise<OrdemServicoListItem>;
  verifyNumero(numero: string, tenant_id: string): Promise<boolean>;
  list(tenant_id?: string, company_id?: string): Promise<ListOrdensServicoResponse>;
  /** Contagem de OS ativas, agrupada por tenant — resumo multi-institucional do PLATFORM_ADMIN. */
  countActiveByTenant(): Promise<OrdemServicoActiveCountByTenant[]>;
  listOptionsForObra(tenant_id: string): Promise<OrdemServicoOption[]>;
  findById(id: string): Promise<PersistedOrdemServico | null>;
  /**
   * Atualiza número, cronograma e obra e substitui o conjunto de vínculos (valor da OS
   * é recalculado). Se a OS mudar de obra, as notas fiscais dela acompanham.
   */
  update(id: string, data: Omit<OrdemServicoPersistData, "tenant_id">): Promise<OrdemServicoListItem>;
  /** Empenhos vinculados à OS (valores em reais). */
  listVinculos(id: string): Promise<OrdemServicoVinculo[]>;
  /** Se já existe nota fiscal (qualquer status) desta OS lançada no empenho. */
  hasInvoicesForEmpenho(id: string, empenho_id: string): Promise<boolean>;
  /** Se já existe nota fiscal (qualquer status) lançada nesta OS. */
  hasInvoices(id: string): Promise<boolean>;
  updateStatus(id: string, status: OrdemServicoStatusValue): Promise<PersistedOrdemServico>;
  delete(id: string): Promise<void>;
  hasObraVinculada(id: string): Promise<boolean>;
}
