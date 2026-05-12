import type { CompanyType } from "../../../domain/entities/Company.js";
import type { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository.js";
type UpdateCompanyUseCaseRequest = {
    id: string;
    company: CompanyType;
};
export declare class UpdateCompanyUseCase {
    private repository;
    constructor(repository: ICompanyRepository);
    execute({ id, company }: UpdateCompanyUseCaseRequest): Promise<{
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
export {};
//# sourceMappingURL=UpdateCompanyUseCase.d.ts.map