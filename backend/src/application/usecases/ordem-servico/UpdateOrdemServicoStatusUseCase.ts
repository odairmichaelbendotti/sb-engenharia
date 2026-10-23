import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { OrdemServicoStatusValue } from "../../../domain/entities/OrdemServico.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";
import type { IOrdemServicoTramitacaoRepository } from "../../../domain/repositories/IOrdemServicoTramitacaoRepository.js";
import { autorDe } from "../ordem-servico-tramitacao/tramitacao-access.js";

const STATUS_LABEL: Record<OrdemServicoStatusValue, string> = {
  ATIVO: "Ativa",
  FINALIZADO: "Finalizada",
  CANCELADO: "Cancelada",
};

export class UpdateOrdemServicoStatusUseCase {
  constructor(
    private repository: IOrdemServicoRepository,
    private tramitacaoRepository: IOrdemServicoTramitacaoRepository,
  ) {}

  async execute({
    ordemServicoId,
    status,
    user,
  }: {
    ordemServicoId: string;
    status: OrdemServicoStatusValue;
    user: AuthenticatedUser;
  }) {
    const canEdit = new DomainAccessPolicy().can(user.role, "administrativo", "edit");
    if (!canEdit) {
      throw new DomainError("User is not authorized to perform this action");
    }

    const existing = await this.repository.findById(ordemServicoId);
    if (!existing || existing.tenant_id !== user.tenant_id) {
      throw new DomainError("OrdemServico not found");
    }

    const updated = await this.repository.updateStatus(ordemServicoId, status);
    if (existing.status !== status) {
      await this.tramitacaoRepository.registrarStatus({
        ordemServico_id: ordemServicoId,
        autor: autorDe(user),
        texto: `Situação alterada de ${STATUS_LABEL[existing.status]} para ${STATUS_LABEL[status]}.`,
      });
    }
    return updated;
  }
}
