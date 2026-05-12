import { DomainError } from "../../../domain/errors/DomainError.js";
export class UpdateCompanyUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute({ id, company }) {
        try {
            const companyExists = await this.repository.findById(id);
            if (!companyExists) {
                throw new DomainError("Company not found");
            }
            if (company.cnpj && company.cnpj !== companyExists.cnpj) {
                const cnpjInUse = await this.repository.verifyCnpj(company.cnpj);
                if (cnpjInUse) {
                    throw new DomainError("CNPJ already exists");
                }
            }
            const updatedCompany = await this.repository.update(id, {
                name: company.name,
                cnpj: company.cnpj,
                cep: company.cep,
                city: company.city,
                state: company.state,
                address: company.address,
                phone: company.phone,
                email: company.email,
            });
            if (!updatedCompany) {
                throw new DomainError("Company not updated");
            }
            return updatedCompany;
        }
        catch (error) {
            if (error instanceof DomainError) {
                throw error;
            }
            throw new DomainError("Error updating company");
        }
    }
}
//# sourceMappingURL=UpdateCompanyUseCase.js.map