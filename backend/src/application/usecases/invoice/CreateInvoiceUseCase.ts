import { Invoice, type InvoiceType } from "../../../domain/entities/Invoice.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";
import type { IInvoiceRepository } from "../../../domain/repositories/IInvoiceRepository.js";
import type { IObraRepository } from "../../../domain/repositories/IObraRepository.js";

export class CreateInvoiceUseCase {
  constructor(
    private repository: IInvoiceRepository,
    private empenhoRepository: IEmpenhoRepository,
    private obraRepository: IObraRepository,
  ) {}

  async execute({
    numero,
    description,
    vencimento,
    value,
    empenho_id,
    company_id,
    obra_id,
  }: InvoiceType) {
    if (value <= 0) {
      throw new DomainError("Value must be greater than 0");
    }

    const empenho = await this.empenhoRepository.findByEmpenhoId(empenho_id);

    if (!empenho) {
      throw new DomainError("Empenho not found");
    }

    if (empenho.totalPaid + Math.round(value * 100) > empenho.value) {
      throw new DomainError("Value exceeds empenho limit");
    }

    if (obra_id) {
      const obra = await this.obraRepository.findById(obra_id);
      if (!obra) {
        throw new DomainError("Obra not found");
      }
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
      obra_id,
    });

    return await this.repository.create({
      numero: invoiceEntity.numero,
      description: invoiceEntity.description,
      vencimento: invoiceEntity.vencimento,
      value: Math.round(invoiceEntity.value * 100),
      empenho_id: invoiceEntity.empenho_id,
      company_id: invoiceEntity.company_id,
      obra_id: invoiceEntity.obra_id,
    });
  }
}
