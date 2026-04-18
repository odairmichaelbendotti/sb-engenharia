import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser";
import { DomainError } from "../../../domain/errors/DomainError";
import { AdminPolicy } from "../../../domain/polices/AdminPolicy";
import type {
  IEmpenhoRepository,
  UpdateStatusDTO,
} from "../../../domain/repositories/IEmpenhoRepository";

export class UpdateStatusEmpenhoUseCase {
  constructor(private repository: IEmpenhoRepository) {}

  async execute(
    empenhoId: string,
    status: UpdateStatusDTO,
    user: AuthenticatedUser,
  ) {
    const isAdmin = new AdminPolicy().isAdmin(user);
    if (!isAdmin) throw new DomainError("User can't update empenho status");

    return this.repository.updateStatus(empenhoId, status);
  }
}
