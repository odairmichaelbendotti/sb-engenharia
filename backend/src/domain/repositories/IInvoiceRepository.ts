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

export interface IInvoiceRepository {
  create(invoice: InvoiceType): Promise<PersistedInvoice>;
  findByNumber(number: string): Promise<PersistedInvoice | null>;
  list(tenant_id?: string): Promise<listInvoices>;
  delete(id: string): Promise<void>;
  update(invoice: InvoiceType, id: string): Promise<InvoiceType>;
}
