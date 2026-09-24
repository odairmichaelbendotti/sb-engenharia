import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { IContratoRepository } from "../../../domain/repositories/IContratoRepository.js";

export class ListContratosUseCase {
  constructor(private repository: IContratoRepository) {}

  async execute(user: AuthenticatedUser) {
    const tenant_id =
      user.role === "PLATFORM_ADMIN" ? undefined : user.tenant_id;
    return this.repository.list(tenant_id);
  }
}
