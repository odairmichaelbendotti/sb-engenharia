import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { OrdemServicoStatusValue } from "../../../domain/entities/OrdemServico.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";

export class UpdateOrdemServicoStatusUseCase {
  constructor(private repository: IOrdemServicoRepository) {}

  async execute({
    ordemServicoId,
    status,
    user,
  }: {
    ordemServicoId: string;
    status: OrdemServicoStatusValue;
    user: AuthenticatedUser;
  }) {
    const canEdit = new DomainAccessPolicy().can(user.role, "administrativo", "edit");
    if (!canEdit) {
      throw new DomainError("User is not authorized to perform this action");
    }

    const existing = await this.repository.findById(ordemServicoId);
    if (!existing || existing.tenant_id !== user.tenant_id) {
      throw new DomainError("OrdemServico not found");
    }

    return this.repository.updateStatus(ordemServicoId, status);
  }
}
