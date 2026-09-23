import type {
  InvoiceType,
  PersistedInvoice,
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
  allInvoices: PersistedInvoice[];
};

export type InvoiceSummaryByTenant = {
  tenant_id: string;
  pendentesVencidasCount: number;
  pendentesVencidasValor: number;
};

export interface IInvoiceRepository {
  create(invoice: InvoiceType): Promise<PersistedInvoice>;
  findByNumber(number: string): Promise<PersistedInvoice | null>;
  list(tenant_id?: string): Promise<listInvoices>;
  /** Notas fiscais pendentes/vencidas, agrupadas por tenant — resumo multi-institucional do PLATFORM_ADMIN. */
  summaryByTenant(): Promise<InvoiceSummaryByTenant[]>;
  delete(id: string): Promise<void>;
  update(invoice: InvoiceType, id: string): Promise<InvoiceType>;
}
