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

const MOCK_DATA: ListObras = {
  obras: [
    {
      id: "1",
      nome: "Construção do Centro Comunitário Norte",
      codigo: "OB-2025-001",
      tipo: "CONSTRUCAO",
      status: "EM_ANDAMENTO",
      descricao: "Construção de centro comunitário com salão multiuso, área administrativa e banheiros acessíveis, conforme projeto arquitetônico aprovado.",
      logradouro: "Av. Brasil, 1500 - Bairro Norte",
      cidade: "Curitiba",
      estado: "PR",
      orcamento: 1850000,
      valorExecutado: 920000,
      dataInicio: new Date("2025-01-15"),
      dataPrevisaoTermino: new Date("2025-12-30"),
      responsavelTecnico: "Eng.º Carlos Mendes — CREA 54321",
      anotacoes: "Fundações concluídas. Estrutura em andamento.",
      createdAt: new Date("2025-01-10"),
      updatedAt: new Date("2025-05-10"),
    },
    {
      id: "2",
      nome: "Pavimentação Rua das Acácias",
      codigo: "OB-2025-002",
      tipo: "PAVIMENTACAO",
      status: "CONCLUIDA",
      descricao: "Pavimentação asfáltica com meio-fio, sarjeta e sinalização horizontal em 1,2 km de extensão.",
      logradouro: "Rua das Acácias, trecho 1 ao 3",
      cidade: "São José dos Pinhais",
      estado: "PR",
      orcamento: 480000,
      valorExecutado: 475000,
      dataInicio: new Date("2024-09-01"),
      dataPrevisaoTermino: new Date("2025-02-28"),
      dataConclusao: new Date("2025-02-20"),
      responsavelTecnico: "Eng.ª Ana Paula Lima — CREA 98765",
      createdAt: new Date("2024-08-20"),
      updatedAt: new Date("2025-02-20"),
    },
    {
      id: "3",
      nome: "Reforma da UBS Vila Verde",
      codigo: "OB-2025-003",
      tipo: "REFORMA",
      status: "PARALISADA",
      descricao: "Reforma completa da unidade básica de saúde, incluindo instalações elétricas, hidráulicas e adequação às normas de acessibilidade.",
      logradouro: "Rua Verde, 300 - Vila Verde",
      cidade: "Colombo",
      estado: "PR",
      orcamento: 320000,
      valorExecutado: 95000,
      dataInicio: new Date("2025-02-01"),
      dataPrevisaoTermino: new Date("2025-06-15"),
      responsavelTecnico: "Eng.º Roberto Alves — CREA 11223",
      anotacoes: "Paralisada aguardando liberação de verba suplementar.",
      createdAt: new Date("2025-01-25"),
      updatedAt: new Date("2025-04-01"),
    },
    {
      id: "4",
      nome: "Ampliação da Escola Municipal João Paulo",
      codigo: "OB-2025-004",
      tipo: "AMPLIACAO",
      status: "EM_ANDAMENTO",
      descricao: "Ampliação com construção de 6 salas de aula, biblioteca e quadra poliesportiva coberta.",
      logradouro: "R. João Paulo II, 800 - Jd. Esperança",
      cidade: "Pinhais",
      estado: "PR",
      orcamento: 2100000,
      valorExecutado: 210000,
      dataInicio: new Date("2025-04-01"),
      dataPrevisaoTermino: new Date("2026-03-31"),
      responsavelTecnico: "Eng.º Marcelo Fonseca — CREA 44556",
      createdAt: new Date("2025-03-15"),
      updatedAt: new Date("2025-05-15"),
    },
    {
      id: "5",
      nome: "Sistema de Esgoto Bairro Industrial",
      codigo: "OB-2024-018",
      tipo: "SANEAMENTO",
      status: "CANCELADA",
      descricao: "Implantação de rede coletora de esgoto sanitário com 3,8 km de extensão e estação elevatória.",
      logradouro: "Zona Industrial — Setores A, B e C",
      cidade: "Araucária",
      estado: "PR",
      orcamento: 3400000,
      valorExecutado: 0,
      dataInicio: new Date("2025-03-01"),
      dataPrevisaoTermino: new Date("2026-02-28"),
      responsavelTecnico: "Eng.ª Fernanda Costa — CREA 77889",
      anotacoes: "Cancelada por decisão judicial — área em litígio.",
      createdAt: new Date("2024-12-01"),
      updatedAt: new Date("2025-03-10"),
    },
  ],
  stats: {
    total: 5,
    emAndamento: 2,
    concluidas: 1,
    paralisadas: 1,
    canceladas: 1,
    orcamentoTotal: 8150000,
    valorExecutadoTotal: 1700000,
  },
};

export const useObras = create<ObrasState>((set) => ({
  data: MOCK_DATA,

  fetchObras: async () => {
    try {
      const response = await defaultFetch("/obra/list", { credentials: "include" });
      if (!response.ok) return;
      const data: ListObras = await response.json();
      set({ data });
    } catch {
      // backend não disponível — mantém dados mock
    }
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
