export type Invoice = {
  id: string;
  numero: string;
  description: string;
  vencimento: string;
  value: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  empenho_id: string;
  company_id: string;
  company: {
    id: string;
    name: string;
    cnpj: string;
    cep: string;
    city: string;
    state: string;
    address: string;
    phone: string;
    email: string;
    hasActiveContract: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

export type InvoiceDashboard = {
  totalCount: number;
  totalValue: number;
  paidInvoices: number;
  paidValue: number;
  expiredCount: number;
  expiredValue: number;
  pendingInvoices: number;
  pendingValue: number;
  allInvoices: Invoice[];
};

export type InvoiceFormData = {
  numero: string;
  description: string;
  vencimento: string;
  value: string;
  empenho_id: string;
  company_id: string;
  status: "paid" | "pending" | "overdue" | "cancelled";
};
