import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";

export class ListOrdemServicoOptionsForObraUseCase {
  constructor(private repository: IOrdemServicoRepository) {}

  async execute(user: AuthenticatedUser) {
    return this.repository.listOptionsForObra(user.tenant_id);
  }
}
