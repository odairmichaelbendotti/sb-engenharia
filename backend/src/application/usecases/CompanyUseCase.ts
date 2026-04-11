import type { CompanyType } from "../../domain/entities/Company";
import { DomainError } from "../../domain/errors/DomainError";
import type { ICompanyRepository } from "../../domain/repositories/ICompanyRepository";

export class CompanyUseCase {
  constructor(private repository: ICompanyRepository) {}

  async execute({
    name,
    cnpj,
    city,
    state,
    address,
    phone,
    email,
  }: CompanyType) {
    if (!name || !cnpj || !city || !state || !address || !phone || !email) {
      throw new DomainError("All fields are required");
    }

    const company = await this.repository.create({
      name,
      cnpj,
      city,
      state,
      address,
      phone,
      email,
    });
    if (!company) throw new Error("Company not created");
    console.log(company);
    return company;
  }
}
