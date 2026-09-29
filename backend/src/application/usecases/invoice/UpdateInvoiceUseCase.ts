import type { UpdateInvoiceType } from "../../../domain/entities/Invoice.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type { IInvoiceRepository } from "../../../domain/repositories/IInvoiceRepository.js";
import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { normalizeInput, INVOICE_RULES } from "../../../domain/normalization/input-rules.js";
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
    invoice: UpdateInvoiceType;
    id: string;
    user: AuthenticatedUser;
  }) {
    // Padroniza os textos antes de validar, buscar duplicados e gravar
    invoice = normalizeInput(invoice, INVOICE_RULES);
    const value = Number(invoice.value);
    if (!Number.isFinite(value) || value <= 0) {
      throw new DomainError("Value must be greater than 0");
    }

    await this.scopeValidator.validateOwnership(user, id);
    const empenho = await this.scopeValidator.validate(user, invoice.empenho_id, invoice.company_id);
    await this.scopeValidator.validateObra(invoice.empenho_id, invoice.obra_id);

    // Nota cancelada não consome o empenho; as demais somam ao que já foi lançado, sem contar a própria nota
    if (invoice.status !== "CANCELADO") {
      const otherInvoices = await this.repository.sumActiveValueByEmpenho(invoice.empenho_id, id);
      if (Math.round((otherInvoices + value) * 100) > empenho.value) {
        throw new DomainError("Value exceeds empenho limit");
      }
    }

    return this.repository.update({ ...invoice, value }, id);
  }
}
