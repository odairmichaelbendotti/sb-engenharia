import { create } from "zustand";
import type { ListEmpenhos } from "../../types/list-empenhos";
import { defaultFetch } from "../services/api";

type EmpenhosState = {
  data: ListEmpenhos | null;
  fetchListEmpenhos: () => Promise<void>;
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
  delete: async (id: string) => {
    try {
      if (!id) {
        throw new Error("ID do empenho é obrigatório");
      }

      const response = await defaultFetch(`/empenho/delete/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao deletar empenho");
      }

      // Atualizar a lista de empenhos após deletar
      const currentState = useEmpenhos.getState();
      if (currentState.data) {
        const updatedData = {
          ...currentState.data,
          empenhos: currentState.data.empenhos.filter(
            (empenho) => empenho.id !== id,
          ),
        };
        set({ data: updatedData });
      }
    } catch (error) {
      throw new Error("Erro ao deletar empenho");
    }
  },
}));
