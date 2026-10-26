import { create } from "zustand";
import type {
  MedicaoDetalhe,
  MedicaoPayload,
  OrcamentoItemPayload,
  PainelMedicaoItem,
  PlanilhaOrcamento,
} from "../../types/medicao";
import { defaultFetch } from "../services/api";

// Orçamento e medições da OS. Sem estado: cada tela guarda o que buscou e recarrega depois de
// cada ação
type MedicoesState = {
  fetchPainel: () => Promise<PainelMedicaoItem[]>;
  fetchPlanilha: (ordemServicoId: string) => Promise<PlanilhaOrcamento>;
  saveOrcamento: (ordemServicoId: string, itens: OrcamentoItemPayload[]) => Promise<void>;
  fetchMedicao: (medicaoId: string) => Promise<MedicaoDetalhe>;
  createMedicao: (ordemServicoId: string, dados: MedicaoPayload) => Promise<string>;
  updateMedicao: (medicaoId: string, dados: MedicaoPayload) => Promise<void>;
  deleteMedicao: (medicaoId: string) => Promise<void>;
  fecharMedicao: (medicaoId: string) => Promise<void>;
  reabrirMedicao: (medicaoId: string) => Promise<void>;
  fetchMedicaoDocument: (medicaoId: string) => Promise<Blob>;
};

async function send<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body: object | undefined,
  fallback: string,
): Promise<T> {
  const response = await defaultFetch(endpoint, {
    method,
    credentials: "include",
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || fallback);
  return data as T;
}

export const useMedicoes = create<MedicoesState>(() => ({
  fetchPainel: () => send("/medicao/painel", "GET", undefined, "Erro ao carregar as medições"),

  fetchPlanilha: (ordemServicoId) =>
    send(`/ordem-servico/${ordemServicoId}/orcamento`, "GET", undefined, "Erro ao carregar o orçamento da OS"),

  saveOrcamento: async (ordemServicoId, itens) => {
    await send(`/ordem-servico/${ordemServicoId}/orcamento`, "PUT", { itens }, "Erro ao salvar o orçamento");
  },

  fetchMedicao: (medicaoId) => send(`/medicao/${medicaoId}`, "GET", undefined, "Erro ao carregar a medição"),

  createMedicao: async (ordemServicoId, dados) => {
    const { id } = await send<{ id: string }>(
      "/medicao/create",
      "POST",
      { ordemServico_id: ordemServicoId, ...dados },
      "Erro ao criar a medição",
    );
    return id;
  },

  updateMedicao: async (medicaoId, dados) => {
    await send(`/medicao/${medicaoId}`, "PUT", dados, "Erro ao salvar a medição");
  },

  deleteMedicao: async (medicaoId) => {
    await send(`/medicao/${medicaoId}`, "DELETE", undefined, "Erro ao excluir a medição");
  },

  fecharMedicao: async (medicaoId) => {
    await send(`/medicao/${medicaoId}/fechar`, "POST", {}, "Erro ao fechar a medição");
  },

  reabrirMedicao: async (medicaoId) => {
    await send(`/medicao/${medicaoId}/reabrir`, "POST", {}, "Erro ao reabrir a medição");
  },

  fetchMedicaoDocument: async (medicaoId) => {
    const response = await defaultFetch(`/medicao/${medicaoId}/document`, { credentials: "include" });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.message || "Erro ao gerar o PDF da medição");
    }
    return response.blob();
  },
}));
