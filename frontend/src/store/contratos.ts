import { create } from "zustand";
import type { ListContratos, Contrato, ContratoStatus, CreateContratoPayload, ContratoOption } from "../../types/contrato";
import { defaultFetch } from "../services/api";

type ContratosState = {
  data: ListContratos | null;
  options: ContratoOption[];
  fetchContratos: () => Promise<void>;
  fetchContratoOptions: () => Promise<void>;
  createContrato: (payload: CreateContratoPayload) => Promise<Contrato>;
  updateContrato: (id: string, payload: CreateContratoPayload) => Promise<Contrato>;
  updateContratoStatus: (id: string, status: ContratoStatus) => Promise<void>;
  deleteContrato: (id: string) => Promise<void>;
};

export const useContratos = create<ContratosState>((set) => ({
  data: null,
  options: [],

  fetchContratos: async () => {
    const response = await defaultFetch("/contrato/list", { credentials: "include" });
    if (!response.ok) throw new Error("Erro ao carregar contratos");
    const data: ListContratos = await response.json();
    set({ data });
  },

  fetchContratoOptions: async () => {
    const response = await defaultFetch("/contrato/list-for-obra", { credentials: "include" });
    if (!response.ok) throw new Error("Erro ao carregar contratos disponíveis");
    const options: ContratoOption[] = await response.json();
    set({ options });
  },

  createContrato: async (payload) => {
    const response = await defaultFetch("/contrato/create", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Erro ao criar contrato");
    set((state) => {
      if (!state.data) return state;
      return {
        data: {
          ...state.data,
          contratos: [data, ...state.data.contratos],
          stats: { ...state.data.stats, total: state.data.stats.total + 1, ativos: state.data.stats.ativos + 1 },
        },
      };
    });
    return data;
  },

  updateContrato: async (id, payload) => {
    const response = await defaultFetch(`/contrato/update/${id}`, {
      method: "PUT",
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Erro ao atualizar contrato");
    set((state) => {
      if (!state.data) return state;
      return {
        data: {
          ...state.data,
          contratos: state.data.contratos.map((c) => (c.id === id ? { ...c, ...data } : c)),
        },
      };
    });
    return data;
  },

  updateContratoStatus: async (id, status) => {
    const response = await defaultFetch(`/contrato/update-status/${id}`, {
      method: "PUT",
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error("Erro ao atualizar status");
    set((state) => {
      if (!state.data) return state;
      return {
        data: {
          ...state.data,
          contratos: state.data.contratos.map((c) => (c.id === id ? { ...c, status } : c)),
        },
      };
    });
  },

  deleteContrato: async (id) => {
    const response = await defaultFetch(`/contrato/delete/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao deletar contrato");
    set((state) => {
      if (!state.data) return state;
      return {
        data: {
          ...state.data,
          contratos: state.data.contratos.filter((c) => c.id !== id),
          stats: { ...state.data.stats, total: state.data.stats.total - 1 },
        },
      };
    });
  },
}));
