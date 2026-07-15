import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";

type DeleteEmpenhoUseCaseInput = {
  user: AuthenticatedUser;
  empenhoId: string;
};

export class DeleteEmpenhoUseCase {
  constructor(private deleteEmpenho: IEmpenhoRepository) {}

  async execute({ user, empenhoId }: DeleteEmpenhoUseCaseInput): Promise<void> {
    const canEdit = new DomainAccessPolicy().can(
      user.role,
      "administrativo",
      "edit",
    );

    if (!canEdit) {
      throw new DomainError("User is not authorized to perform this action");
    }

    await this.deleteEmpenho.delete(empenhoId);
  }
}
