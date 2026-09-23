import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";

export class ListOrdensServicoUseCase {
  constructor(private repository: IOrdemServicoRepository) {}

  async execute(user: AuthenticatedUser) {
    return this.repository.list(user.tenant_id);
  }
}
