export interface NotaFiscal {
  id: string;
  numero: string;
  description: string;
  vencimento: string;
  value: number;
  empenho_id: string;
  company_id: string;
  status: "paid" | "pending" | "overdue" | "cancelled";
  client?: string;
  date?: string;
}

export interface NotaFiscalFormData {
  numero: string;
  description: string;
  vencimento: string;
  value: string;
  empenho_id: string;
  company_id: string;
  status: "paid" | "pending" | "overdue" | "cancelled";
}
