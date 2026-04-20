import { create } from "zustand";
import { defaultFetch } from "../services/api";

export type CreateInvoiceProps = {
  numero: string;
  description: string;
  vencimento: string;
  value: number;
  empenho_id: string;
  company_id: string;
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
  create: (createInvoice: CreateInvoiceProps) => Promise<void>;
  list: () => Promise<void>;
  delete: (id: string) => Promise<void>;
  update: (id: string, updateInvoice: CreateInvoiceProps) => Promise<Invoice>;
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

  async create(createInvoice: CreateInvoiceProps) {
    try {
      const response = await defaultFetch(`/nota-fiscal/create`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(createInvoice),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar nota fiscal");
      }

      const data = await response.json();
      set((state) => ({ allInvoices: [...state.allInvoices, data] }));
    } catch (error) {
      console.log(error);
      throw new Error("Erro ao criar nota fiscal");
    }
  },
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
  async delete(id: string) {
    try {
      const response = await defaultFetch(`/invoices/delete/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir nota fiscal - aqui");
      }

      set((state) => ({
        allInvoices: state.allInvoices.filter((invoice) => invoice.id !== id),
      }));

      return await response.json();
    } catch (error) {
      console.log(error);
      throw new Error("Erro ao excluir nota fiscal");
    }
  },
  async update(id: string, invoice: CreateInvoiceProps) {
    try {
      const response = await defaultFetch(`/invoices/update/${id}`, {
        method: "PUT",
        body: JSON.stringify(invoice),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar nota fiscal");
      }

      const data = await response.json();

      set((state) => ({
        allInvoices: state.allInvoices.map((invoice) =>
          invoice.id === data.id ? data : invoice,
        ),
      }));

      return data;
    } catch (error) {
      console.log(error);
      throw new Error("Erro ao atualizar nota fiscal");
    }
  },
}));
