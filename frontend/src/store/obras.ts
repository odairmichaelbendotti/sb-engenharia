import { create } from "zustand";
import type { ListObras, Obra, ObraStatus, CreateObraPayload } from "../../types/obra";
import { defaultFetch } from "../services/api";

type ObrasState = {
  data: ListObras | null;
  fetchObras: () => Promise<void>;
  createObra: (payload: CreateObraPayload) => Promise<Obra>;
  updateObra: (id: string, payload: Partial<CreateObraPayload>) => Promise<Obra>;
  updateObraStatus: (id: string, status: ObraStatus) => Promise<void>;
  deleteObra: (id: string) => Promise<void>;
};

export const useObras = create<ObrasState>((set) => ({
  data: null,

  fetchObras: async () => {
    const response = await defaultFetch("/obra/list", { credentials: "include" });
    if (!response.ok) throw new Error("Erro ao carregar obras");
    const data: ListObras = await response.json();
    set({ data });
  },

  createObra: async (payload) => {
    const response = await defaultFetch("/obra/create", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Erro ao criar obra");
    set((state) => {
      if (!state.data) return state;
      return {
        data: {
          ...state.data,
          obras: [data, ...state.data.obras],
          stats: { ...state.data.stats, total: state.data.stats.total + 1, emAndamento: state.data.stats.emAndamento + 1 },
        },
      };
    });
    return data;
  },

  updateObra: async (id, payload) => {
    const response = await defaultFetch(`/obra/update/${id}`, {
      method: "PUT",
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Erro ao atualizar obra");
    set((state) => {
      if (!state.data) return state;
      return {
        data: {
          ...state.data,
          obras: state.data.obras.map((o) => (o.id === id ? data : o)),
        },
      };
    });
    return data;
  },

  updateObraStatus: async (id, status) => {
    const response = await defaultFetch(`/obra/update-status/${id}`, {
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
          obras: state.data.obras.map((o) => (o.id === id ? { ...o, status } : o)),
        },
      };
    });
  },

  deleteObra: async (id) => {
    const response = await defaultFetch(`/obra/delete/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao deletar obra");
    set((state) => {
      if (!state.data) return state;
      return {
        data: {
          ...state.data,
          obras: state.data.obras.filter((o) => o.id !== id),
          stats: { ...state.data.stats, total: state.data.stats.total - 1 },
        },
      };
    });
  },
}));
