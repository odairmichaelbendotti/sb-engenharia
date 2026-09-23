import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type { IObraRepository } from "../../../domain/repositories/IObraRepository.js";

export class ListObraOptionsForInvoiceUseCase {
  constructor(private repository: IObraRepository) {}

  async execute({ user, empenho_id }: { user: AuthenticatedUser; empenho_id: string }) {
    if (!empenho_id) {
      throw new DomainError("empenho_id is required");
    }

    return this.repository.listOptionsForInvoice(user.tenant_id, empenho_id);
  }
}
