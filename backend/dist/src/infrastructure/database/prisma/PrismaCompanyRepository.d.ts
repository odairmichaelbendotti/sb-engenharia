import type { CompanyEntity } from "../../../domain/entities/Company.js";
import type { ICompanyRepository, ListCompaniesResponse } from "../../../domain/repositories/ICompanyRepository.js";
import type { Company, Empenho } from "../../../generated/prisma/client.js";
export declare class PrismaCompanyRepository implements ICompanyRepository {
    create(company: CompanyEntity): Promise<Company>;
    verifyCnpj(cnpj: string): Promise<boolean>;
    list(): Promise<ListCompaniesResponse>;
    delete(id: string): Promise<void>;
    findById(id: string): Promise<Company | null>;
    update(id: string, company: Company & Empenho[]): Promise<Company>;
}
//# sourceMappingURL=PrismaCompanyRepository.d.ts.map