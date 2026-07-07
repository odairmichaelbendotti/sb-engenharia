import type { IInvoiceRepository } from "../../../domain/repositories/IInvoiceRepository.js";

export class ListInvoicesUseCase {
  constructor(private repository: IInvoiceRepository) {}

  async execute() {
    return await this.repository.list();
  }
}
