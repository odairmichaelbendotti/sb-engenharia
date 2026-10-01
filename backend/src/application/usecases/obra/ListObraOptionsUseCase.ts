import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { IObraRepository } from "../../../domain/repositories/IObraRepository.js";

// Obras da organização para o campo "Obra" do cadastro de OS
export class ListObraOptionsUseCase {
  constructor(private repository: IObraRepository) {}

  async execute(user: AuthenticatedUser) {
    return this.repository.listOptions(user.tenant_id);
  }
}
