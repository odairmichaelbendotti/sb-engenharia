import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { IContratoRepository } from "../../../domain/repositories/IContratoRepository.js";

export class ListContratosUseCase {
  constructor(private repository: IContratoRepository) {}

  async execute(user: AuthenticatedUser) {
    return this.repository.list(user.tenant_id);
  }
}
