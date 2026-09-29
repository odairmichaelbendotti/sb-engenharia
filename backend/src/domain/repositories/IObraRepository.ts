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

export type ObraOrdemServicoInfo = {
  ordemServico: {
    id: string;
    numero: string;
    valor: number;
    status: string;
    empenho: {
      id: string;
      numero: string;
      description: string;
      category: string;
      status: string;
      value: number;
      totalPaid: number;
      startAt: Date;
      endAt: Date;
      contrato: {
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
    };
  };
};

export type ObraInvoiceResumo = {
  id: string;
  numero: string;
  description: string;
  vencimento: Date;
  value: number;
  status: string;
};

export type ObraInvoiceInfo = {
  invoices: ObraInvoiceResumo[];
};

export type ListObrasResponse = {
  obras: (PersistedObra & ObraOrdemServicoInfo & ObraInvoiceInfo)[];
  stats: ObraStats;
};

export type ObraOptionForInvoice = {
  id: string;
  nome: string;
  identificacaoPatrimonial: string;
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

// Situação de cada empenho que financia a OS desta obra
export type ObraDetailEmpenhoFinanceiro = {
  id: string;
  value: number;
  // Quanto do empenho foi destinado a esta OS
  valorNaOS: number;
  // Liquidado do empenho inteiro (todas as OS)
  liquidado: number;
  // Liquidado só nesta obra
  liquidadoNaOS: number;
  // Soma do destinado a OS não canceladas (inclui esta OS)
  comprometidoOS: number;
  ordensServicoCount: number;
};

export type ObraDetailFinancial = {
  ordemServico: { valor: number; liquidado: number };
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
  obra: Omit<PersistedObra, "valorExecutado">;
  ordemServico: { id: string; numero: string; status: string };
  // Empenhos que financiam a OS, na ordem em que foram vinculados (o primeiro é o principal)
  empenhos: {
    id: string;
    numero: string;
    description: string;
    status: string;
    startAt: Date;
    endAt: Date;
  }[];
  contrato: {
    id: string;
    identificador: string;
    descricaoCurta: string;
    cor: string;
    status: string;
    dataInicio: Date;
    dataFim: Date;
    company: { id: string; name: string; cnpj: string };
  };
  // null quando o usuário não pode ver o domínio administrativo (ex.: EMPRESA)
  financial: ObraDetailFinancial | null;
};

export interface IObraRepository {
  /** Detalhe da obra restrito ao tenant e, para EMPRESA, à própria empresa; null se não encontrada. */
  getDetail(id: string, tenant_id: string | undefined, company_id?: string): Promise<ObraDetail | null>;
  create(obra: ObraEntity): Promise<PersistedObra & ObraOrdemServicoInfo>;
  list(tenant_id: string | undefined, company_id?: string, includeInvoices?: boolean): Promise<ListObrasResponse>;
  listOptionsForInvoice(tenant_id: string, empenho_id: string): Promise<ObraOptionForInvoice[]>;
  /** Obras em andamento + orçamento/executado, agrupados por tenant — resumo multi-institucional do PLATFORM_ADMIN. */
  summaryByTenant(): Promise<ObraSummaryByTenant[]>;
  findById(id: string): Promise<PersistedObra | null>;
  /** Empenhos que financiam a OS da obra (obra → OS → empenhos); null se a obra não existe. */
  findEmpenhoIds(id: string): Promise<string[] | null>;
  /** Se o empenho financia a OS de alguma obra — nesse caso a NF precisa indicar a obra. */
  empenhoHasObra(empenho_id: string): Promise<boolean>;
  update(id: string, obra: ObraType): Promise<PersistedObra & ObraOrdemServicoInfo>;
  updateStatus(id: string, status: ObraStatusValue): Promise<PersistedObra & ObraOrdemServicoInfo>;
  delete(id: string): Promise<void>;
}
