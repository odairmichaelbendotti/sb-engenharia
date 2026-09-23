import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IObraRepository } from "../../../domain/repositories/IObraRepository.js";

type DeleteObraUseCaseRequest = {
  id: string;
  user: AuthenticatedUser;
};

export class DeleteObraUseCase {
  constructor(private repository: IObraRepository) {}

  async execute({ id, user }: DeleteObraUseCaseRequest) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.tenant_id !== user.tenant_id) {
      throw new DomainError("Obra not found");
    }

    const canEdit = new DomainAccessPolicy().can(user.role, "engenharia", "edit");
    if (!canEdit) {
      throw new DomainError("You are not authorized to delete an obra");
    }

    await this.repository.delete(id);
  }
}
