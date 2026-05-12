import type { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository.js";
export declare class DeleteCompanyUseCase {
    private repository;
    constructor(repository: ICompanyRepository);
    execute(id: string): Promise<void>;
}
//# sourceMappingURL=DeleteCompanyUseCase.d.ts.map