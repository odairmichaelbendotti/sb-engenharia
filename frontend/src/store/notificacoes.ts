import { create } from "zustand";
import type { Notificacao } from "../../types/tramitacao";
import { defaultFetch } from "../services/api";

type NotificacoesState = {
  notificacoes: Notificacao[];
  naoLidas: number;
  fetchNotificacoes: () => Promise<void>;
  marcarLida: (id: string) => Promise<void>;
  marcarTodasLidas: () => Promise<void>;
};

export const useNotificacoes = create<NotificacoesState>((set) => ({
  notificacoes: [],
  naoLidas: 0,

  fetchNotificacoes: async () => {
    const response = await defaultFetch("/notificacoes", { credentials: "include" });
    if (!response.ok) throw new Error("Erro ao carregar notificações");
    const data: { notificacoes: Notificacao[]; naoLidas: number } = await response.json();
    set(data);
  },

  marcarLida: async (id) => {
    const response = await defaultFetch(`/notificacoes/${id}/lida`, { method: "PUT", credentials: "include" });
    if (!response.ok) throw new Error("Erro ao marcar notificação como lida");
    const lidaEm = new Date().toISOString();
    set((state) => {
      const alvo = state.notificacoes.find((n) => n.id === id);
      if (!alvo || alvo.lidaEm) return state;
      return {
        notificacoes: state.notificacoes.map((n) => (n.id === id ? { ...n, lidaEm } : n)),
        naoLidas: Math.max(0, state.naoLidas - 1),
      };
    });
  },

  marcarTodasLidas: async () => {
    const response = await defaultFetch("/notificacoes/lidas", { method: "PUT", credentials: "include" });
    if (!response.ok) throw new Error("Erro ao marcar notificações como lidas");
    const lidaEm = new Date().toISOString();
    set((state) => ({
      notificacoes: state.notificacoes.map((n) => (n.lidaEm ? n : { ...n, lidaEm })),
      naoLidas: 0,
    }));
  },
}));
