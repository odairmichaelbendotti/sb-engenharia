import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type {
  IEmpenhoRepository,
  UpdateStatusDTO,
} from "../../../domain/repositories/IEmpenhoRepository.js";

export class UpdateStatusEmpenhoUseCase {
  constructor(private repository: IEmpenhoRepository) {}

  async execute({
    empenhoId,
    status,
    user,
  }: {
    empenhoId: string;
    status: UpdateStatusDTO;
    user: AuthenticatedUser;
  }) {
    const canEdit = new DomainAccessPolicy().can(
      user.role,
      "administrativo",
      "edit",
    );
    if (!canEdit) throw new DomainError("User can't update empenho status");

    return this.repository.updateStatus(empenhoId, status);
  }
}
