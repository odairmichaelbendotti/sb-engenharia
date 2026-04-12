import type { Company } from "../../generated/prisma/client";
import { CompanyEntity, type CompanyType } from "../entities/Company.js";

export type ListCompaniesResponse = {
  companies: Company[];
  stats: {
    totalCompanies: number;
    totalEmpenhos: number;
    totalEmpenhosActive: number;
    totalEmpenhosValue: number;
  };
};

export interface ICompanyRepository {
  create(company: CompanyEntity): Promise<Company>;
  verifyCnpj(cnpj: string): Promise<boolean>;
  list(): Promise<ListCompaniesResponse>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Company | null>;
  update(id: string, company: CompanyType): Promise<Company>;
}
