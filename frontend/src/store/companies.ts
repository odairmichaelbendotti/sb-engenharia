import { create } from "zustand";
import { defaultFetch } from "../services/api";
import type { Empresa } from "../../types/empresa";

type CompaniesStore = {
  companies: Empresa[];
  listCompanies: () => void;
};

export const useCompanies = create<CompaniesStore>((set) => ({
  companies: [],

  listCompanies: async () => {
    const response = await defaultFetch("/company/list");
    if (!response.ok) {
      throw new Error("Failed to fetch companies");
    }

    const data = await response.json();
    set({ companies: data.length > 0 ? data : [] });
  },
}));
