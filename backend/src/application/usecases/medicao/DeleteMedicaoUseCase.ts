import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { IMedicaoRepository } from "../../../domain/repositories/IMedicaoRepository.js";
import { assertPodeEditar, loadOsDaMedicao } from "./medicao-access.js";

// Exclui o rascunho ou a última medição fechada (as quantidades voltam ao saldo do orçamento)
export class DeleteMedicaoUseCase {
  constructor(private repository: IMedicaoRepository) {}

  async execute({ medicaoId, user }: { medicaoId: string; user: AuthenticatedUser }) {
    const os = await loadOsDaMedicao(this.repository, medicaoId, user);
    assertPodeEditar(user, os);
    await this.repository.deleteMedicao(medicaoId);
  }
}
