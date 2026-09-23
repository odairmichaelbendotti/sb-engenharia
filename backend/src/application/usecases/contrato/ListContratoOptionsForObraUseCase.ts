import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { IContratoRepository } from "../../../domain/repositories/IContratoRepository.js";

export class ListContratoOptionsForObraUseCase {
  constructor(private repository: IContratoRepository) {}

  async execute(user: AuthenticatedUser) {
    return this.repository.listOptionsForObra(user.tenant_id);
  }
}
