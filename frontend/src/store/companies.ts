import { create } from "zustand";
import { defaultFetch } from "../services/api";
import type { Empresa } from "../../types/empresa";
import type { CreateCompanyType } from "../../types/create-company";
import type { ListCompanies } from "../../types/list-companies";
import type { StatsCompany } from "../../types/list-companies";

type findCepType = {
  bairro: string;
  cep: string;
  complemento: string;
  ddd: string;
  estado: string;
  gia: string;
  ibge: string;
  localidade: string;
  logradouro: string;
  regiao: string;
  siafi: string;
  uf: string;
  unidade: string;
};

type CompaniesStore = {
  companies: Empresa[];
  stats: StatsCompany | null;
  listCompanies: () => void;
  createCompany: (empresa: CreateCompanyType) => Promise<Empresa>;
  deleteCompany: (id: string) => Promise<void>;
  updateCompany: (id: string, empresa: CreateCompanyType) => Promise<void>;
  findCep: (cep: string) => Promise<findCepType>;
};

export const useCompanies = create<CompaniesStore>((set) => ({
  companies: [],
  stats: null,

  listCompanies: async () => {
    const response = await defaultFetch("/company/list");
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch companies");
    }

    const data = (await response.json()) as ListCompanies;
    set({ stats: data.stats });
    set({ companies: data.companies.length > 0 ? data.companies : [] });
  },
  findCep: async (cep: string): Promise<findCepType> => {
    if (!cep || cep.length < 8) throw new Error("CEP inválido");

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

      if (!response.ok) throw new Error("CEP não encontrado");

      const data = await response.json();
      return data as findCepType;
    } catch (error) {
      console.error(error);
      throw new Error("Erro ao buscar CEP");
    }
  },
  createCompany: async (empresa: CreateCompanyType) => {
    const response = await defaultFetch("/company/create", {
      method: "POST",
      body: JSON.stringify(empresa),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create company");
    }

    const data = await response.json();
    const companyWithEmpenhos = { ...data, empenhos: [] };
    set((state) => ({ companies: [...state.companies, companyWithEmpenhos] }));
    set((state) => ({
      stats: state.stats
        ? { ...state.stats, totalCompanies: state.stats.totalCompanies + 1 }
        : null,
    }));
    return companyWithEmpenhos;
  },
  deleteCompany: async (id: string) => {
    try {
      const response = await defaultFetch(`/company/delete/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao deletar empresa");
      }

      set((state) => ({
        companies: state.companies.filter((company) => company.id !== id),
      }));
      set((state) => ({
        stats: state.stats
          ? { ...state.stats, totalCompanies: state.stats.totalCompanies - 1 }
          : null,
      }));
    } catch (error) {
      console.log(error);
      throw new Error("Erro ao deletar empresa");
    }
  },
  updateCompany: async (id: string, company: Partial<Empresa>) => {
    try {
      const response = await defaultFetch(`/company/update/${id}`, {
        method: "PUT",
        body: JSON.stringify(company),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar empresa");
      }

      const data = (await response.json()) as Empresa;

      set((state) => ({
        companies: state.companies.map((company) =>
          company.id === id ? data : company,
        ),
      }));
    } catch (error) {
      console.log(error);
      throw new Error("Erro ao atualizar empresa");
    }
  },
}));
