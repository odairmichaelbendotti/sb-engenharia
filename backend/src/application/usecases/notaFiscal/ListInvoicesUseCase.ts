import type { INotaFiscalRepository } from "../../../domain/repositories/INotaFiscalRepository.js";

export class ListInvoicesUseCase {
  constructor(private repository: INotaFiscalRepository) {}

  async execute() {
    return await this.repository.list();
  }
}
