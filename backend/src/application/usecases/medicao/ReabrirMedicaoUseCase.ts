import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { IMedicaoRepository } from "../../../domain/repositories/IMedicaoRepository.js";
import { assertPodeEditar, autorDe, loadOsDaMedicao } from "./medicao-access.js";

// Volta a última medição fechada para rascunho (sem outro rascunho aberto), para correção
export class ReabrirMedicaoUseCase {
  constructor(private repository: IMedicaoRepository) {}

  async execute({ medicaoId, user }: { medicaoId: string; user: AuthenticatedUser }) {
    const os = await loadOsDaMedicao(this.repository, medicaoId, user);
    assertPodeEditar(user, os);
    await this.repository.reabrirMedicao({ medicao_id: medicaoId, autor: autorDe(user), now: new Date() });
  }
}
