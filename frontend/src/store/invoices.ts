import { create } from "zustand";
import { defaultFetch } from "../services/api";
import type {
  CreateInvoiceProps,
  Invoice,
  InvoiceDashboard,
} from "../../types/invoice";
import type { Empresa } from "../../types/empresa";

export type { Invoice, InvoiceDashboard, CreateInvoiceProps };

// Traduz as mensagens de regra de negócio do backend para exibir no toast
const API_ERROR_MESSAGES: Record<string, string> = {
  "Value exceeds empenho limit": "O valor ultrapassa o saldo disponível do empenho",
  "Value must be greater than 0": "O valor deve ser maior que zero",
  "Obra does not belong to this empenho": "A obra selecionada não pertence a este empenho",
  "Nota fiscal already exists": "Já existe uma nota fiscal com este número para esta empresa e empenho",
};

async function apiErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return (body.message && API_ERROR_MESSAGES[body.message]) || fallback;
  } catch {
    return fallback;
  }
}

type InvoiceStore = InvoiceDashboard & {
  create: (createInvoice: CreateInvoiceProps) => Promise<void>;
  list: () => Promise<void>;
  delete: (id: string) => Promise<void>;
  update: (id: string, updateInvoice: CreateInvoiceProps) => Promise<Invoice>;
  /** Empresas com contrato na organização do usuário, com os empenhos dessa organização. */
  companyOptions: Empresa[];
  fetchCompanyOptions: () => Promise<void>;
};

export const useInvoice = create<InvoiceStore>((set, get) => ({
  totalCount: 0,
  totalValue: 0,
  paidInvoices: 0,
  paidValue: 0,
  expiredCount: 0,
  expiredValue: 0,
  pendingInvoices: 0,
  pendingValue: 0,
  allInvoices: [],
  companyOptions: [],

  async fetchCompanyOptions() {
    const response = await defaultFetch("/invoices/company-options", {
      credentials: "include",
    });

    if (!response.ok) throw new Error("Erro ao buscar empresas");

    const data = (await response.json()) as Empresa[];
    set({ companyOptions: data });
  },

  async create(createInvoice: CreateInvoiceProps) {
    const response = await defaultFetch(`/invoices/create`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(createInvoice),
    });

    if (!response.ok) {
      throw new Error(await apiErrorMessage(response, "Erro ao criar nota fiscal"));
    }

    // Recarrega do servidor para lista, totais dos cards e valores ficarem iguais ao banco
    await get().list();
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

    await get().list();
  },
  async update(id: string, invoice: CreateInvoiceProps) {
    const response = await defaultFetch(`/invoices/update/${id}`, {
      method: "PUT",
      body: JSON.stringify(invoice),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(await apiErrorMessage(response, "Erro ao atualizar nota fiscal"));
    }

    const data = (await response.json()) as Invoice;
    await get().list();
    return data;
  },
}));
