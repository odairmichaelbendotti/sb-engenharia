import type { CompanyType } from "../../../domain/entities/Company.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository.js";

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
  }: CompanyType) {
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

    const cnpjAlreadyExists = await this.repository.verifyCnpj(cnpj);

    if (cnpjAlreadyExists) {
      throw new DomainError("CNPJ already exists");
    }

    const company = await this.repository.create({
      name,
      cnpj,
      cep,
      city,
      state,
      address,
      phone,
      email,
    });
    if (!company) throw new Error("Company not created");
    return company;
  }
}
