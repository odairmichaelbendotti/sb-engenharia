import type { Company } from "../../generated/prisma/client";
import { CompanyEntity } from "../entities/Company.js";

export interface ICompanyRepository {
  create(company: CompanyEntity): Promise<Company>;
  verifyCnpj(cnpj: string): Promise<boolean>;
  list(): Promise<Company[]>;
}
