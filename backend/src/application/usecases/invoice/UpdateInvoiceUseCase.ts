import type { InvoiceType } from "../../../domain/entities/Invoice.js";
import type { IInvoiceRepository } from "../../../domain/repositories/IInvoiceRepository.js";
import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { InvoiceScopeValidator } from "./InvoiceScopeValidator.js";

export class UpdateInvoiceUseCase {
  constructor(
    private repository: IInvoiceRepository,
    private scopeValidator: InvoiceScopeValidator,
  ) {}

  async execute({
    invoice,
    id,
    user,
  }: {
    invoice: InvoiceType;
    id: string;
    user: AuthenticatedUser;
  }) {
    await this.scopeValidator.validateOwnership(user, id);
    await this.scopeValidator.validate(user, invoice.empenho_id, invoice.company_id);
    return this.repository.update(invoice, id);
  }
}
