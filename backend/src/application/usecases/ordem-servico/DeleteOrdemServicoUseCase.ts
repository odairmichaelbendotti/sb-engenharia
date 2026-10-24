import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";
import type { IOrdemServicoTramitacaoRepository } from "../../../domain/repositories/IOrdemServicoTramitacaoRepository.js";
import type { IMedicaoRepository } from "../../../domain/repositories/IMedicaoRepository.js";

export class DeleteOrdemServicoUseCase {
  constructor(
    private repository: IOrdemServicoRepository,
    private tramitacaoRepository: IOrdemServicoTramitacaoRepository,
    private medicaoRepository: IMedicaoRepository,
  ) {}

  async execute({ ordemServicoId, user }: { ordemServicoId: string; user: AuthenticatedUser }) {
    const canEdit = new DomainAccessPolicy().can(user.role, "administrativo", "edit");
    if (!canEdit) {
      throw new DomainError("User is not authorized to perform this action");
    }

    const existing = await this.repository.findById(ordemServicoId);
    if (!existing || existing.tenant_id !== user.tenant_id) {
      throw new DomainError("OrdemServico not found");
    }

    // Depois que a empresa abriu, deu ciência, apontou ou comentou, o histórico é prova: a OS
    // só pode ser cancelada, não excluída
    if (await this.tramitacaoRepository.hasInteracaoEmpresa(ordemServicoId)) {
      throw new DomainError(
        "This ordem de serviço already has a history with the company: cancel it instead of deleting it",
      );
    }

    // Medição fechada é documento assinado: também só se cancela a OS
    if (await this.medicaoRepository.hasMedicaoFechada(ordemServicoId)) {
      throw new DomainError("This ordem de serviço already has closed medições: cancel it instead of deleting it");
    }

    await this.repository.delete(ordemServicoId);
  }
}
