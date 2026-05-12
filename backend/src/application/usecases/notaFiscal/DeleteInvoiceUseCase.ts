import type { INotaFiscalRepository } from "../../../domain/repositories/INotaFiscalRepository.js";

export class DeleteInvoiceUseCase {
  constructor(private deleteInvoice: INotaFiscalRepository) {}

  async execute(id: string) {
    return await this.deleteInvoice.delete(id);
  }
}
