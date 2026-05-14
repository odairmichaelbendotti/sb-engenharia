import type { Company, Empenho } from "../../generated/prisma/client.js";
import { CompanyEntity, type CompanyType } from "../entities/Company.js";

export type ListCompaniesResponse = {
  companies: (Company & { empenhos: Empenho[] })[];
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
