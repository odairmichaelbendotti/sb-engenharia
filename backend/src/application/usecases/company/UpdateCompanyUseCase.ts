import type { CompanyType } from "../../../domain/entities/Company";
import { DomainError } from "../../../domain/errors/DomainError";
import type { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository";

type UpdateCompanyUseCaseRequest = {
  id: string;
  company: CompanyType;
};

export class UpdateCompanyUseCase {
  constructor(private repository: ICompanyRepository) {}

  async execute({ id, company }: UpdateCompanyUseCaseRequest) {
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
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      throw new DomainError("Error updating company");
    }
  }
}
