import {
  CompanyEntity,
  type CompanyType,
  type PersistedCompany,
} from "../entities/Company.js";
import type { PersistedEmpenho } from "../entities/Empenho.js";

export type ListCompaniesResponse = {
  companies: (PersistedCompany & { empenhos: PersistedEmpenho[] })[];
  stats: {
    totalCompanies: number;
    totalEmpenhos: number;
    totalEmpenhosActive: number;
    totalEmpenhosValue: number;
  };
};

export interface ICompanyRepository {
  create(company: CompanyEntity): Promise<PersistedCompany>;
  verifyCnpj(cnpj: string): Promise<boolean>;
  list(): Promise<ListCompaniesResponse>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<PersistedCompany | null>;
  update(id: string, company: CompanyType): Promise<PersistedCompany>;
}
