import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { ObraStatusValue } from "../../../domain/entities/Obra.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IObraRepository } from "../../../domain/repositories/IObraRepository.js";

type UpdateObraStatusUseCaseRequest = {
  id: string;
  status: ObraStatusValue;
  user: AuthenticatedUser;
};

export class UpdateObraStatusUseCase {
  constructor(private repository: IObraRepository) {}

  async execute({ id, status, user }: UpdateObraStatusUseCaseRequest) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.tenant_id !== user.tenant_id) {
      throw new DomainError("Obra not found");
    }

    const canEdit = new DomainAccessPolicy().can(user.role, "engenharia", "edit");
    if (!canEdit) {
      throw new DomainError("You are not authorized to update an obra");
    }

    return this.repository.updateStatus(id, status);
  }
}
