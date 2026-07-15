import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";
import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";

export class ListEmpenhosUseCase {
  constructor(private repository: IEmpenhoRepository) {}

  async execute(user: AuthenticatedUser) {
    const tenant_id =
      user.role === "PLATFORM_ADMIN" ? undefined : user.tenant_id;
    return await this.repository.list(tenant_id);
  }
}
