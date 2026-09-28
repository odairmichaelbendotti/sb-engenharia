import type { IInvoiceRepository } from "../../../domain/repositories/IInvoiceRepository.js";
import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { InvoiceScopeValidator } from "./InvoiceScopeValidator.js";

export class DeleteInvoiceUseCase {
  constructor(
    private deleteInvoice: IInvoiceRepository,
    private scopeValidator: InvoiceScopeValidator,
  ) {}

  async execute({ id, user }: { id: string; user: AuthenticatedUser }) {
    await this.scopeValidator.validateOwnership(user, id);
    return await this.deleteInvoice.delete(id);
  }
}
