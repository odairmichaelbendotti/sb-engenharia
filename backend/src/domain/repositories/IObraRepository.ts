import { ObraEntity, type ObraType, type PersistedObra, type ObraStatusValue } from "../entities/Obra.js";

export type ObraStats = {
  total: number;
  emAndamento: number;
  concluidas: number;
  paralisadas: number;
  canceladas: number;
  orcamentoTotal: number;
  valorExecutadoTotal: number;
};

export type ObraContratoInfo = {
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

// OS executada na obra, com o cronograma e quanto dela já foi executado (notas fiscais)
export type ObraOrdemServicoResumo = {
  id: string;
  numero: string;
  valor: number;
  status: string;
  dataInicio: Date | null;
  dataPrevisaoTermino: Date | null;
  // Soma das notas não canceladas lançadas nesta OS
  valorExecutado: number;
  empenhos: { empenho_id: string; numero: string }[];
  contrato: ObraContratoInfo;
};

export type ObraInvoiceResumo = {
  id: string;
  numero: string;
  description: string;
  vencimento: Date;
  value: number;
  status: string;
  ordemServico_id: string | null;
};

// Obra como a listagem devolve: o orçamento e o prazo vêm das OS da obra
export type ObraListItem = PersistedObra & {
  // Menor início e maior previsão de término entre as OS não canceladas
  dataInicio: Date | null;
  dataPrevisaoTermino: Date | null;
  // Soma do valor das OS não canceladas
  valor: number;
  // Contrato da OS mais antiga — define a cor da obra no mapa
  contrato: ObraContratoInfo | null;
  ordensServico: ObraOrdemServicoResumo[];
  invoices: ObraInvoiceResumo[];
};

export type ListObrasResponse = {
  obras: ObraListItem[];
  stats: ObraStats;
};

// Uma opção por OS: a nota fiscal indica a obra e a OS dela que está sendo paga
export type ObraOptionForInvoice = {
  id: string;
  nome: string;
  identificacaoPatrimonial: string;
  ordemServico: { id: string; numero: string };
};

export type ObraOption = {
  id: string;
  nome: string;
  identificacaoPatrimonial: string;
  status: ObraStatusValue;
  // Empenhos e contratos das OS da obra: o cadastro de OS filtra as obras por eles
  empenhoIds: string[];
  contratoIds: string[];
};

export type ObraSummaryByTenant = {
  tenant_id: string;
  emAndamento: number;
  orcamentoTotal: number;
  valorExecutadoTotal: number;
};

// Detalhe da obra para o painel do Mapa: cadeia Contrato → Empenho → OS → Obra.
// Valores em reais; liquidado sempre calculado a partir das notas fiscais não canceladas.
export type ObraDetailEmpenhoResumo = {
  id: string;
  numero: string;
  description: string;
  status: string;
  startAt: Date;
  endAt: Date;
  value: number;
  liquidado: number;
  ordensServicoCount: number;
};

// Situação de cada empenho que financia as OS desta obra
export type ObraDetailEmpenhoFinanceiro = {
  id: string;
  value: number;
  // Quanto do empenho foi destinado às OS desta obra
  valorNaOS: number;
  // Liquidado do empenho inteiro (todas as OS)
  liquidado: number;
  // Liquidado só nesta obra
  liquidadoNaOS: number;
  // Soma do destinado a OS não canceladas (inclui as desta obra)
  comprometidoOS: number;
  ordensServicoCount: number;
};

export type ObraDetailFinancial = {
  // Totais da obra: soma das OS não canceladas e das notas da obra
  obra: { valor: number; liquidado: number };
  empenhos: ObraDetailEmpenhoFinanceiro[];
  contrato: {
    valor: number;
    // Totais consideram só empenhos não cancelados
    totalEmpenhado: number;
    totalLiquidado: number;
    empenhos: ObraDetailEmpenhoResumo[];
  };
  invoices: ObraInvoiceResumo[];
};

export type ObraDetail = {
  obra: Omit<PersistedObra, "valorExecutado"> & {
    dataInicio: Date | null;
    dataPrevisaoTermino: Date | null;
  };
  ordensServico: ObraOrdemServicoResumo[];
  // Empenhos que financiam as OS da obra, na ordem em que foram vinculados
  empenhos: {
    id: string;
    numero: string;
    description: string;
    status: string;
    startAt: Date;
    endAt: Date;
  }[];
  // Contrato da OS mais antiga da obra
  contrato: ObraContratoInfo & {
    status: string;
    dataInicio: Date;
    dataFim: Date;
  };
  // null quando o usuário não pode ver o domínio administrativo (ex.: EMPRESA)
  financial: ObraDetailFinancial | null;
};

export interface IObraRepository {
  /** Detalhe da obra restrito ao tenant e, para EMPRESA, à própria empresa; null se não encontrada. */
  getDetail(id: string, tenant_id: string | undefined, company_id?: string): Promise<ObraDetail | null>;
  /** Cria a obra e vincula a ela as OS informadas (ao menos uma). */
  create(obra: ObraEntity, ordemServicoIds: string[]): Promise<ObraListItem>;
  list(tenant_id: string | undefined, company_id?: string, includeInvoices?: boolean): Promise<ListObrasResponse>;
  /** OS (com obra) financiadas pelo empenho — opções de obra/OS da nota fiscal. */
  listOptionsForInvoice(tenant_id: string, empenho_id: string): Promise<ObraOptionForInvoice[]>;
  /** Obras da organização — opções do campo "Obra" no cadastro da OS. */
  listOptions(tenant_id: string): Promise<ObraOption[]>;
  /** Obras em andamento + orçamento/executado, agrupados por tenant — resumo multi-institucional do PLATFORM_ADMIN. */
  summaryByTenant(): Promise<ObraSummaryByTenant[]>;
  findById(id: string): Promise<PersistedObra | null>;
  /** Ids das OS vinculadas à obra. */
  findOrdemServicoIds(id: string): Promise<string[]>;
  /**
   * Atualiza os dados da obra. Com `ordemServicoIds`, o conjunto de OS da obra passa a ser
   * exatamente esse (as que saem ficam sem obra).
   */
  update(id: string, obra: ObraType, ordemServicoIds?: string[]): Promise<ObraListItem>;
  updateStatus(id: string, status: ObraStatusValue): Promise<ObraListItem>;
  delete(id: string): Promise<void>;
}
