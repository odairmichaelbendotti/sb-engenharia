import type { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository.js";
export declare class ListCompaniesUseCase {
    private repository;
    constructor(repository: ICompanyRepository);
    execute(): Promise<import("../../../domain/repositories/ICompanyRepository.js").ListCompaniesResponse>;
}
//# sourceMappingURL=ListCompaniesUseCase.d.ts.map