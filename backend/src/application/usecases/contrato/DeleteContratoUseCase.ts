import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IContratoRepository } from "../../../domain/repositories/IContratoRepository.js";

export class DeleteContratoUseCase {
  constructor(private repository: IContratoRepository) {}

  async execute({ contratoId, user }: { contratoId: string; user: AuthenticatedUser }) {
    const canEdit = new DomainAccessPolicy().can(user.role, "administrativo", "edit");
    if (!canEdit) {
      throw new DomainError("User is not authorized to perform this action");
    }

    const existing = await this.repository.findById(contratoId);
    if (!existing || existing.tenant_id !== user.tenant_id) {
      throw new DomainError("Contrato not found");
    }

    await this.repository.delete(contratoId);
  }
}
