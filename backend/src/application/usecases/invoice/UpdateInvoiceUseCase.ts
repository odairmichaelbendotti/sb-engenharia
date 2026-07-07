import type { InvoiceType } from "../../../domain/entities/Invoice.js";
import type { IInvoiceRepository } from "../../../domain/repositories/IInvoiceRepository.js";

export class UpdateInvoiceUseCase {
  constructor(private repository: IInvoiceRepository) {}

  async execute({
    invoice,
    id,
  }: {
    invoice: InvoiceType;
    id: string;
  }) {
    return this.repository.update(invoice, id);
  }
}
