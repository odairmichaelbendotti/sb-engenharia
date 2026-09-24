import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";

export class ListOrdensServicoUseCase {
  constructor(private repository: IOrdemServicoRepository) {}

  async execute(user: AuthenticatedUser) {
    const tenant_id =
      user.role === "PLATFORM_ADMIN" ? undefined : user.tenant_id;
    return this.repository.list(tenant_id);
  }
}
