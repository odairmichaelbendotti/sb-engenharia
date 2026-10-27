import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { IOrdemServicoDocumentGenerator } from "../../../domain/documents/IOrdemServicoDocumentGenerator.js";
import { buildOrdemServicoDocumentModel } from "../../../domain/documents/ordem-servico-document.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";

export class GenerateOrdemServicoDocumentUseCase {
  constructor(
    private repository: IOrdemServicoRepository,
    private generator: IOrdemServicoDocumentGenerator,
  ) {}

  async execute({ ordemServicoId, user }: { ordemServicoId: string; user: AuthenticatedUser }) {
    const data = await this.repository.getDocumentData(ordemServicoId);

    // Mesmo escopo da listagem: só a própria base (PLATFORM_ADMIN vê todas) e, para EMPRESA, só os
    // próprios contratos e as OS já emitidas (a fiscalização baixa a que aguarda emissão para conferir)
    const outOfScope =
      !data ||
      (user.role !== "PLATFORM_ADMIN" && data.ordemServico.tenant_id !== user.tenant_id) ||
      (user.role === "EMPRESA" &&
        (data.contrato.company_id !== user.company_id || data.ordemServico.aguardandoEmissao));
    if (!data || outOfScope) {
      throw new DomainError("OrdemServico not found");
    }

    const content = await this.generator.generate(buildOrdemServicoDocumentModel(data));
    // Barra no número (OS 010/BAFL/2026) não serve em nome de arquivo
    const filename = `${data.ordemServico.numero.replace(/[\/:*?"<>|]+/g, "-")}.pdf`;
    return { filename, content };
  }
}
