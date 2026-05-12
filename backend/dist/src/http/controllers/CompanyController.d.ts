import type { Request, Response } from "express";
import { CreateCompanyUseCase } from "../../application/usecases/company/CreateCompanyUseCase.js";
import type { ListCompaniesUseCase } from "../../application/usecases/company/ListCompaniesUseCase.js";
import type { DeleteCompanyUseCase } from "../../application/usecases/company/DeleteCompanyUseCase.js";
import type { UpdateCompanyUseCase } from "../../application/usecases/company/UpdateCompanyUseCase.js";
export declare class CompanyController {
    private createCompany;
    private listCompanies;
    private deleteCompany;
    private updateCompany;
    constructor(createCompany: CreateCompanyUseCase, listCompanies: ListCompaniesUseCase, deleteCompany: DeleteCompanyUseCase, updateCompany: UpdateCompanyUseCase);
    create(req: Request, res: Response): Promise<void>;
    list(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    delete(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    update(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=CompanyController.d.ts.map