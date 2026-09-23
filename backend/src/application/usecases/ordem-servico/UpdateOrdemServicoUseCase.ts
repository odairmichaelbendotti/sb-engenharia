import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { OrdemServicoType } from "../../../domain/entities/OrdemServico.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";

export class UpdateOrdemServicoUseCase {
  constructor(
    private repository: IOrdemServicoRepository,
    private empenhoRepository: IEmpenhoRepository,
  ) {}

  async execute({
    ordemServicoId,
    data,
    user,
  }: {
    ordemServicoId: string;
    data: Omit<OrdemServicoType, "tenant_id">;
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

    if (data.empenho_id && data.empenho_id !== existing.empenho_id) {
      const empenho = await this.empenhoRepository.findByEmpenhoId(data.empenho_id);
      if (!empenho || empenho.tenant_id !== user.tenant_id) {
        throw new DomainError("Empenho not found");
      }
    }

    if (data.numero && data.numero !== existing.numero) {
      const numeroAlreadyExists = await this.repository.verifyNumero(data.numero, user.tenant_id);
      if (numeroAlreadyExists) {
        throw new DomainError("Numero already exists");
      }
    }

    if (data.valor) {
      const empenhoId = data.empenho_id ?? existing.empenho_id;
      const saldoDisponivel = await this.empenhoRepository.getSaldoDisponivel(empenhoId, ordemServicoId);
      if (data.valor > saldoDisponivel) {
        throw new DomainError(
          `OrdemServico valor (${data.valor}) exceeds empenho available balance (${saldoDisponivel})`,
        );
      }
    }

    return this.repository.update(ordemServicoId, {
      ...data,
      valor: Math.round(data.valor * 100),
      tenant_id: existing.tenant_id,
    });
  }
}
