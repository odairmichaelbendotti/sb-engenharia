import type {
  InvoiceType,
  PersistedInvoice,
  UpdateInvoiceType,
} from "../entities/Invoice.js";

export type listInvoices = {
  totalCount: number;
  totalValue: number;
  paidInvoices: number;
  paidValue: number;
  expiredCount: number;
  expiredValue: number;
  pendingInvoices: number;
  pendingValue: number;
  allInvoices: InvoiceListItem[];
};

// Nota como a listagem devolve: com a origem (empenho, OS e obra) que ela paga
export type InvoiceListItem = PersistedInvoice & {
  empenho: { id: string; numero: string; contrato: { id: string; identificador: string } };
  ordemServico: { id: string; numero: string } | null;
  obra: { id: string; nome: string; identificacaoPatrimonial: string } | null;
};

export type InvoiceSummaryByTenant = {
  tenant_id: string;
  pendentesVencidasCount: number;
  pendentesVencidasValor: number;
};

export interface IInvoiceRepository {
  /** Valores em reais na entrada e na saída; o repositório converte para centavos e recalcula o totalPaid do empenho. */
  create(invoice: InvoiceType): Promise<PersistedInvoice>;
  /** Soma em reais das notas não canceladas do empenho, opcionalmente ignorando uma nota (edição). */
  sumActiveValueByEmpenho(empenho_id: string, excludeInvoiceId?: string): Promise<number>;
  findByNumber(number: string): Promise<PersistedInvoice | null>;
  /** tenant da nota, herdado do empenho (nota não tem tenant_id próprio). */
  findTenantId(id: string): Promise<string | null>;
  list(tenant_id?: string): Promise<listInvoices>;
  /** Notas fiscais pendentes/vencidas, agrupadas por tenant — resumo multi-institucional do PLATFORM_ADMIN. */
  summaryByTenant(): Promise<InvoiceSummaryByTenant[]>;
  delete(id: string): Promise<void>;
  update(invoice: UpdateInvoiceType, id: string): Promise<PersistedInvoice>;
}
