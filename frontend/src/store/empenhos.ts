import { create } from "zustand";
import type { ListEmpenhos } from "../../types/list-empenhos";
import { defaultFetch } from "../services/api";

type EmpenhosState = {
  data: ListEmpenhos | null;
  fetchListEmpenhos: () => Promise<void>;
  deleteEmpenho: (id: string) => Promise<void>;
  updateStatus: (data: UpdateEmpenhoStatus) => Promise<void>;
};

type UpdateEmpenhoStatus = {
  status: "ATIVO" | "FINALIZADO" | "CANCELADO";
  empenhoId: string;
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
      console.log(responseData);
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
        const errorData = await response.json();
        console.log("Erro:", errorData);
        throw new Error("Erro ao deletar empenho");
      }

      set((state) => {
        if (!state.data) return state;
        return {
          data: {
            ...state.data,
            empenhos: state.data.empenhos.filter(
              (empenho) => empenho.id !== id,
            ),
          },
        };
      });

      console.log("Deletado com sucesso - status:", response.status);
    } catch (error) {
      console.log(error);
      throw new Error("Erro ao deletar empenho");
    }
  },
  updateStatus: async ({ empenhoId, status }: UpdateEmpenhoStatus) => {
    try {
      const response = await defaultFetch(
        `/empenho/update-status/${empenhoId}`,
        {
          method: "PUT",
          credentials: "include",
          body: JSON.stringify({ status }),
        },
      );

      if (!response.ok) {
        throw new Error("Erro ao atualizar status do empenho");
      }

      await response.json();

      set((state) => {
        if (!state.data) return state;
        return {
          data: {
            ...state.data,
            empenhos: state.data.empenhos.map((empenho) =>
              empenho.id === empenhoId ? { ...empenho, status } : empenho,
            ),
          },
        };
      });
    } catch (error) {
      console.error(error);
      throw new Error("Erro ao atualizar status do empenho");
    }
  },
}));
