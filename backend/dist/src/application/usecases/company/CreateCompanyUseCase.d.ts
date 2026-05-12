import type { CompanyType } from "../../../domain/entities/Company.js";
import type { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository.js";
export declare class CreateCompanyUseCase {
    private repository;
    constructor(repository: ICompanyRepository);
    execute({ name, cnpj, cep, city, state, address, phone, email, }: CompanyType): Promise<{
        name: string;
        id: string;
        cnpj: string;
        cep: string;
        city: string;
        state: string;
        address: string;
        phone: string;
        email: string;
        hasActiveContract: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
//# sourceMappingURL=CreateCompanyUseCase.d.ts.map