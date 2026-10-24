import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { IMedicaoRepository } from "../../../domain/repositories/IMedicaoRepository.js";
import { assertPodeEditar, loadOsDaMedicao, parseMedicaoDados } from "./medicao-access.js";

// Só o rascunho muda (conferido na transação do repository)
export class UpdateMedicaoUseCase {
  constructor(private repository: IMedicaoRepository) {}

  async execute({ medicaoId, user, body }: { medicaoId: string; user: AuthenticatedUser; body: Record<string, unknown> }) {
    const os = await loadOsDaMedicao(this.repository, medicaoId, user);
    assertPodeEditar(user, os);
    await this.repository.updateMedicao({ medicao_id: medicaoId, dados: parseMedicaoDados(body) });
  }
}
