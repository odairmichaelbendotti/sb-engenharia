import { create } from "zustand";
import type { ListEmpenhos } from "../../types/list-empenhos";
import { defaultFetch } from "../services/api";

type EmpenhosState = {
  data: ListEmpenhos | null;
  fetchListEmpenhos: () => Promise<void>;
  deleteEmpenho: (id: string) => Promise<void>;
};

export const useEmpenhos = create<EmpenhosState>((set) => ({
  data: null,

  fetchListEmpenhos: async () => {
    try {
      const response = await defaultFetch("/empenho/list");

      if (!response.ok) {
        throw new Error("Erro ao buscar empenhos");
      }

      const responseData: ListEmpenhos = await response.json();
      set({ data: responseData });
    } catch (error) {
      console.log(error);
      throw new Error("Erro ao buscar empenhos");
    }
  },
  deleteEmpenho: async (id: string) => {
    try {
      if (!id) {
        throw new Error("ID do empenho é obrigatório");
      }

      const response = await defaultFetch(`/empenho/delete/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erro ao deletar empenho");
      }
    } catch (error) {
      console.log(error);
      throw new Error("Erro ao deletar empenho");
    }
  },
}));
