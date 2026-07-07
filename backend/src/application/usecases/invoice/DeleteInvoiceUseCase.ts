import type { IInvoiceRepository } from "../../../domain/repositories/IInvoiceRepository.js";

export class DeleteInvoiceUseCase {
  constructor(private deleteInvoice: IInvoiceRepository) {}

  async execute(id: string) {
    return await this.deleteInvoice.delete(id);
  }
}
