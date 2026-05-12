import type { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository.js";

export class ListCompaniesUseCase {
  constructor(private repository: ICompanyRepository) {}

  async execute() {
    return this.repository.list();
  }
}
