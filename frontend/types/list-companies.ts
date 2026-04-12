import type { Empresa } from "./empresa";

export type StatsCompany = {
  totalCompanies: number;
  totalEmpenhos: number;
  totalEmpenhosActive: number;
  totalEmpenhosValue: number;
};

export type ListCompanies = {
  companies: Empresa[];
  stats: StatsCompany;
};
