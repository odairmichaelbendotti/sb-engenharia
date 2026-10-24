import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type { IMedicaoRepository } from "../../../domain/repositories/IMedicaoRepository.js";
import { assertPodeEditar, autorDe, loadOsComAcesso, parseMedicaoDados } from "./medicao-access.js";

// Abre a medição como rascunho, com o próximo número da OS
export class CreateMedicaoUseCase {
  constructor(private repository: IMedicaoRepository) {}

  async execute({ user, body }: { user: AuthenticatedUser; body: Record<string, unknown> }) {
    const ordemServicoId = typeof body.ordemServico_id === "string" ? body.ordemServico_id : "";
    if (!ordemServicoId) throw new DomainError("Ordem de serviço is required");
    const os = await loadOsComAcesso(this.repository, ordemServicoId, user);
    assertPodeEditar(user, os);
    const id = await this.repository.createMedicao({
      ordemServico_id: os.id,
      dados: parseMedicaoDados(body),
      autor: autorDe(user),
    });
    return { id };
  }
}
