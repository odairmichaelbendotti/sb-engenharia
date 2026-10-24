import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { IMedicaoRepository } from "../../../domain/repositories/IMedicaoRepository.js";
import { assertPodeEditar, autorDe, loadOsDaMedicao } from "./medicao-access.js";

// Fecha o rascunho: entra no acumulado, a planilha é congelada e a medição fica travada
export class FecharMedicaoUseCase {
  constructor(private repository: IMedicaoRepository) {}

  async execute({ medicaoId, user }: { medicaoId: string; user: AuthenticatedUser }) {
    const os = await loadOsDaMedicao(this.repository, medicaoId, user);
    assertPodeEditar(user, os);
    await this.repository.fecharMedicao({ medicao_id: medicaoId, autor: autorDe(user), now: new Date() });
  }
}
