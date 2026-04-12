import type { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository";

export class DeleteCompanyUseCase {
  constructor(private repository: ICompanyRepository) {}

  async execute(id: string) {
    await this.repository.delete(id);
  }
}
