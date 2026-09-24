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

export interface IObraRepository {
  create(obra: ObraEntity): Promise<PersistedObra & ObraOrdemServicoInfo>;
  list(tenant_id: string | undefined, company_id?: string, includeInvoices?: boolean): Promise<ListObrasResponse>;
  listOptionsForInvoice(tenant_id: string, empenho_id: string): Promise<ObraOptionForInvoice[]>;
  /** Obras em andamento + orçamento/executado, agrupados por tenant — resumo multi-institucional do PLATFORM_ADMIN. */
  summaryByTenant(): Promise<ObraSummaryByTenant[]>;
  findById(id: string): Promise<PersistedObra | null>;
  update(id: string, obra: ObraType): Promise<PersistedObra & ObraOrdemServicoInfo>;
  updateStatus(id: string, status: ObraStatusValue): Promise<PersistedObra & ObraOrdemServicoInfo>;
  delete(id: string): Promise<void>;
}
