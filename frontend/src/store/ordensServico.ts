import { create } from "zustand";
import type {
  ListOrdensServico,
  OrdemServico,
  OrdemServicoStatus,
  CreateOrdemServicoPayload,
  OrdemServicoOption,
} from "../../types/ordem-servico";
import { defaultFetch } from "../services/api";

type OrdensServicoState = {
  data: ListOrdensServico | null;
  options: OrdemServicoOption[];
  fetchOrdensServico: () => Promise<void>;
  fetchOrdemServicoOptions: () => Promise<void>;
  createOrdemServico: (payload: CreateOrdemServicoPayload) => Promise<OrdemServico>;
  updateOrdemServico: (id: string, payload: CreateOrdemServicoPayload) => Promise<OrdemServico>;
  updateOrdemServicoStatus: (id: string, status: OrdemServicoStatus) => Promise<void>;
  deleteOrdemServico: (id: string) => Promise<void>;
};

export const useOrdensServico = create<OrdensServicoState>((set) => ({
  data: null,
  options: [],

  fetchOrdensServico: async () => {
    const response = await defaultFetch("/ordem-servico/list", { credentials: "include" });
    if (!response.ok) throw new Error("Erro ao carregar ordens de serviço");
    const data: ListOrdensServico = await response.json();
    set({ data });
  },

  fetchOrdemServicoOptions: async () => {
    const response = await defaultFetch("/ordem-servico/list-for-obra", { credentials: "include" });
    if (!response.ok) throw new Error("Erro ao carregar ordens de serviço disponíveis");
    const options: OrdemServicoOption[] = await response.json();
    set({ options });
  },

  createOrdemServico: async (payload) => {
    const response = await defaultFetch("/ordem-servico/create", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Erro ao criar ordem de serviço");
    set((state) => {
      if (!state.data) return state;
      return {
        data: {
          ...state.data,
          ordensServico: [data, ...state.data.ordensServico],
          stats: { ...state.data.stats, total: state.data.stats.total + 1, ativas: state.data.stats.ativas + 1 },
        },
      };
    });
    return data;
  },

  updateOrdemServico: async (id, payload) => {
    const response = await defaultFetch(`/ordem-servico/update/${id}`, {
      method: "PUT",
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Erro ao atualizar ordem de serviço");
    set((state) => {
      if (!state.data) return state;
      return {
        data: {
          ...state.data,
          ordensServico: state.data.ordensServico.map((os) => (os.id === id ? { ...os, ...data } : os)),
        },
      };
    });
    return data;
  },

  updateOrdemServicoStatus: async (id, status) => {
    const response = await defaultFetch(`/ordem-servico/update-status/${id}`, {
      method: "PUT",
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro ao atualizar status");
    }
    set((state) => {
      if (!state.data) return state;
      return {
        data: {
          ...state.data,
          ordensServico: state.data.ordensServico.map((os) => (os.id === id ? { ...os, status } : os)),
        },
      };
    });
  },

  deleteOrdemServico: async (id) => {
    const response = await defaultFetch(`/ordem-servico/delete/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro ao deletar ordem de serviço");
    }
    set((state) => {
      if (!state.data) return state;
      return {
        data: {
          ...state.data,
          ordensServico: state.data.ordensServico.filter((os) => os.id !== id),
          stats: { ...state.data.stats, total: state.data.stats.total - 1 },
        },
      };
    });
  },
}));
