import type { INotaFiscalRepository } from "../../../domain/repositories/INotaFiscalRepository";

export class ListInvoicesUseCase {
  constructor(private repository: INotaFiscalRepository) {}

  async execute() {
    return await this.repository.list();
  }
}
