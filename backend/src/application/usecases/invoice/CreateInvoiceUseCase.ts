import { Invoice, type InvoiceType } from "../../../domain/entities/Invoice.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type { IInvoiceRepository } from "../../../domain/repositories/IInvoiceRepository.js";
import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { InvoiceScopeValidator } from "./InvoiceScopeValidator.js";

export class CreateInvoiceUseCase {
  constructor(
    private repository: IInvoiceRepository,
    private scopeValidator: InvoiceScopeValidator,
  ) {}

  async execute(
    {
      numero,
      description,
      vencimento,
      value,
      empenho_id,
      company_id,
      obra_id,
    }: InvoiceType,
    user: AuthenticatedUser,
  ) {
    if (value <= 0) {
      throw new DomainError("Value must be greater than 0");
    }

    const empenho = await this.scopeValidator.validate(user, empenho_id, company_id);

    // Comparação em centavos: empenho.value vem do banco em centavos e a soma em reais
    const alreadyInvoiced = await this.repository.sumActiveValueByEmpenho(empenho_id);
    if (Math.round((alreadyInvoiced + value) * 100) > empenho.value) {
      throw new DomainError("Value exceeds empenho limit");
    }

    await this.scopeValidator.validateObra(empenho_id, obra_id);

    const invoiceExist = await this.repository.findByNumber(numero);

    if (
      invoiceExist &&
      invoiceExist.company_id === company_id &&
      invoiceExist.empenho_id === empenho_id
    ) {
      throw new DomainError("Nota fiscal already exists");
    }

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
      value: invoiceEntity.value,
      empenho_id: invoiceEntity.empenho_id,
      company_id: invoiceEntity.company_id,
      obra_id: invoiceEntity.obra_id,
    });
  }
}
