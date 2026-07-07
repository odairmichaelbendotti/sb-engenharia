import { create } from "zustand";
import { defaultFetch } from "../services/api";
import type {
  CreateInvoiceProps,
  Invoice,
  InvoiceDashboard,
} from "../../types/invoice";

export type { Invoice, InvoiceDashboard, CreateInvoiceProps };

type InvoiceStore = InvoiceDashboard & {
  create: (createInvoice: CreateInvoiceProps) => Promise<void>;
  list: () => Promise<void>;
  delete: (id: string) => Promise<void>;
  update: (id: string, updateInvoice: CreateInvoiceProps) => Promise<Invoice>;
};

export const useInvoice = create<InvoiceStore>((set) => ({
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
    const response = await defaultFetch(`/invoices/create`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(createInvoice),
    });

    if (!response.ok) {
      throw new Error("Erro ao criar nota fiscal");
    }

    const data = await response.json();
    set((state) => ({ allInvoices: [...state.allInvoices, data] }));
  },
  async list() {
    const response = await defaultFetch("/invoices/list", {
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
  },
  async delete(id: string) {
    const response = await defaultFetch(`/invoices/delete/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao excluir nota fiscal");
    }

    set((state) => ({
      allInvoices: state.allInvoices.filter((invoice) => invoice.id !== id),
    }));

    return await response.json();
  },
  async update(id: string, invoice: CreateInvoiceProps) {
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
  },
}));
