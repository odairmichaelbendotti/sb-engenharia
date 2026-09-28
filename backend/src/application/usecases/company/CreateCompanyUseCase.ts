import { CompanyEntity, type CompanyType } from "../../../domain/entities/Company.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository.js";
import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";

export class CreateCompanyUseCase {
  constructor(private repository: ICompanyRepository) {}

  async execute({
    name,
    cnpj,
    cep,
    city,
    state,
    address,
    phone,
    email,
    user,
  }: CompanyType & { user: AuthenticatedUser }) {
    if (
      !name ||
      !cnpj ||
      !cep ||
      !city ||
      !state ||
      !address ||
      !phone ||
      !email
    ) {
      throw new DomainError("All fields are required");
    }

    // CNPJ é único no sistema: se outra base já cadastrou a empresa, só vincula
    // o cadastro existente a esta organização
    const existing = await this.repository.findByCnpj(cnpj);

    if (existing) {
      const isLinked = await this.repository.isLinkedToTenant(existing.id, user.tenant_id);
      if (isLinked) {
        throw new DomainError("CNPJ already exists");
      }
      await this.repository.linkToTenant(existing.id, user.tenant_id);
      return existing;
    }

    const companyEntity = new CompanyEntity({
      name,
      cnpj,
      cep,
      city,
      state,
      address,
      phone,
      email,
    });

    const company = await this.repository.create(companyEntity, user.tenant_id);
    if (!company) throw new DomainError("Company not created");
    return company;
  }
}
