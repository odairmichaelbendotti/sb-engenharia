import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { IMedicaoDocumentGenerator } from "../../../domain/documents/IMedicaoDocumentGenerator.js";
import { buildMedicaoDocumentModel } from "../../../domain/documents/medicao-document.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type { IMedicaoRepository } from "../../../domain/repositories/IMedicaoRepository.js";
import { loadOsDaMedicao } from "./medicao-access.js";

// Boletim de medição em PDF. O rascunho sai com marca d'água; a empresa só baixa as fechadas
export class GenerateMedicaoDocumentUseCase {
  constructor(
    private repository: IMedicaoRepository,
    private generator: IMedicaoDocumentGenerator,
  ) {}

  async execute({ medicaoId, user }: { medicaoId: string; user: AuthenticatedUser }) {
    await loadOsDaMedicao(this.repository, medicaoId, user);
    const data = await this.repository.getDocumentData(medicaoId);
    if (!data || (user.role === "EMPRESA" && data.medicao.status !== "FECHADA")) {
      throw new DomainError("Medição not found");
    }

    const content = await this.generator.generate(buildMedicaoDocumentModel(data, new Date()));
    // Barra no número (OS 010/BAFL/2026) não serve em nome de arquivo
    const os = data.ordemServico.numero.replace(/[\/:*?"<>|]+/g, "-");
    const filename = `Medicao-${String(data.medicao.numero).padStart(2, "0")}-${os}.pdf`;
    return { filename, content };
  }
}
