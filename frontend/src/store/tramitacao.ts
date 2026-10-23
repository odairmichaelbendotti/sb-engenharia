import { create } from "zustand";
import type { OrdemServicoTramitacao, PendenciasCiencia } from "../../types/tramitacao";
import { defaultFetch } from "../services/api";

type TramitacaoState = {
  // OS da empresa aguardando ciência; null até a primeira consulta (só o login EMPRESA consulta)
  pendencias: PendenciasCiencia | null;
  fetchPendencias: () => Promise<void>;
  fetchTramitacao: (ordemServicoId: string) => Promise<OrdemServicoTramitacao>;
  darCiencia: (ordemServicoId: string) => Promise<void>;
  contestar: (ordemServicoId: string, texto: string) => Promise<void>;
  comentar: (ordemServicoId: string, texto: string) => Promise<void>;
  responderContestacao: (contestacaoId: string, decisao: "ACATADA" | "RECUSADA", resposta: string) => Promise<void>;
};

async function send(endpoint: string, method: "POST" | "PUT", body: object, fallback: string) {
  const response = await defaultFetch(endpoint, { method, credentials: "include", body: JSON.stringify(body) });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || fallback);
  }
}

export const useTramitacao = create<TramitacaoState>((set) => ({
  pendencias: null,

  fetchPendencias: async () => {
    const response = await defaultFetch("/ordem-servico/pendencias-ciencia", { credentials: "include" });
    if (!response.ok) throw new Error("Erro ao carregar as ordens de serviço pendentes de ciência");
    const pendencias: PendenciasCiencia = await response.json();
    set({ pendencias });
  },

  fetchTramitacao: async (ordemServicoId) => {
    const response = await defaultFetch(`/ordem-servico/${ordemServicoId}/tramitacao`, { credentials: "include" });
    if (!response.ok) throw new Error("Erro ao carregar o histórico da ordem de serviço");
    return response.json();
  },

  darCiencia: async (ordemServicoId) => {
    await send(`/ordem-servico/${ordemServicoId}/ciencia`, "POST", {}, "Erro ao registrar a ciência");
  },

  contestar: async (ordemServicoId, texto) => {
    await send(`/ordem-servico/${ordemServicoId}/contestacoes`, "POST", { texto }, "Erro ao registrar o apontamento");
  },

  comentar: async (ordemServicoId, texto) => {
    await send(`/ordem-servico/${ordemServicoId}/comentarios`, "POST", { texto }, "Erro ao registrar o comentário");
  },

  responderContestacao: async (contestacaoId, decisao, resposta) => {
    await send(
      `/ordem-servico/contestacoes/${contestacaoId}/resposta`,
      "PUT",
      { decisao, resposta },
      "Erro ao responder o apontamento",
    );
  },
}));
