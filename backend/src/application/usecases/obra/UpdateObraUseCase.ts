import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { ObraType } from "../../../domain/entities/Obra.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IObraRepository } from "../../../domain/repositories/IObraRepository.js";

type UpdateObraUseCaseRequest = {
  id: string;
  obra: Omit<ObraType, "tenant_id" | "ordemServico_id">;
  user: AuthenticatedUser;
};

export class UpdateObraUseCase {
  constructor(private repository: IObraRepository) {}

  async execute({ id, obra, user }: UpdateObraUseCaseRequest) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.tenant_id !== user.tenant_id) {
      throw new DomainError("Obra not found");
    }

    const canEdit = new DomainAccessPolicy().can(user.role, "engenharia", "edit");
    if (!canEdit) {
      throw new DomainError("You are not authorized to update an obra");
    }

    return this.repository.update(id, {
      ...obra,
      tenant_id: existing.tenant_id,
      ordemServico_id: existing.ordemServico_id,
    });
  }
}
