import { Invoice, type InvoiceType } from "../../../domain/entities/Invoice.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";
import type { IInvoiceRepository } from "../../../domain/repositories/IInvoiceRepository.js";

export class CreateInvoiceUseCase {
  constructor(
    private repository: IInvoiceRepository,
    private empenhoRepository: IEmpenhoRepository,
  ) {}

  async execute({
    numero,
    description,
    vencimento,
    value,
    empenho_id,
    company_id,
  }: InvoiceType) {
    if (value <= 0) {
      throw new DomainError("Value must be greater than 0");
    }

    const empenho = await this.empenhoRepository.findByEmpenhoId(empenho_id);

    if (!empenho) {
      throw new DomainError("Empenho not found");
    }

    if (empenho.totalPaid + value * 100 > empenho.value) {
      throw new DomainError("Value exceeds empenho limit");
    }

    const invoiceExist = await this.repository.findByNumber(numero);

    if (
      invoiceExist &&
      invoiceExist.company_id === company_id &&
      invoiceExist.empenho_id === empenho_id
    ) {
      throw new DomainError("Nota fiscal already exists");
    }

    await this.empenhoRepository.incrementInvoiceValue(empenho_id, value);

    const invoiceEntity = new Invoice({
      numero,
      description,
      vencimento: new Date(vencimento),
      value,
      empenho_id,
      company_id,
    });

    return await this.repository.create({
      ...invoiceEntity,
      value: invoiceEntity.value * 100,
    });
  }
}
