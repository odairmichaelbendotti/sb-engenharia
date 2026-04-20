import { create } from "zustand";
import { defaultFetch } from "../services/api";

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
  list: () => void;
};

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

export const useInvoice = create<InvoiceDashboard>((set) => ({
  totalCount: 0,
  totalValue: 0,
  paidInvoices: 0,
  paidValue: 0,
  expiredCount: 0,
  expiredValue: 0,
  pendingInvoices: 0,
  pendingValue: 0,
  allInvoices: [],

  async list() {
    try {
      const response = await defaultFetch("/nota-fiscal/list", {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Erro ao buscar notas fiscais");

      const data = await response.json();
      set({
        totalCount: data.totalCount,
        totalValue: data.totalValue,
        paidInvoices: data.paidInvoices,
        paidValue: data.paidValue,
        expiredCount: data.expiredCount,
        expiredValue: data.expiredValue,
        pendingInvoices: data.pendingInvoices,
        pendingValue: data.pendingValue,
        allInvoices: data.allInvoices,
      });
    } catch (error) {
      console.log(error);
      throw new Error("Erro ao buscar notas fiscais");
    }
  },
}));
