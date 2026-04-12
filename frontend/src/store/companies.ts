import { create } from "zustand";
import { defaultFetch } from "../services/api";
import type { Empresa } from "../../types/empresa";
import type { CreateCompanyType } from "../../types/create-company";
import type { ListCompanies } from "../../types/list-companies";
import type { StatsCompany } from "../../types/list-companies";

type CompaniesStore = {
  companies: Empresa[];
  stats: StatsCompany | null;
  listCompanies: () => void;
  createCompany: (empresa: CreateCompanyType) => Promise<Empresa>;
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
    return companyWithEmpenhos;
  },
}));
