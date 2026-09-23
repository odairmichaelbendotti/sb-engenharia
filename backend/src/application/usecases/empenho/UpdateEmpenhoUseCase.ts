import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { EmpenhoType } from "../../../domain/entities/Empenho.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IContratoRepository } from "../../../domain/repositories/IContratoRepository.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";

export class UpdateEmpenhoUseCase {
  constructor(
    private updateEmpenho: IEmpenhoRepository,
    private findContratoById: IContratoRepository,
  ) {}

  async execute({
    empenhoId,
    data,
    user,
  }: {
    empenhoId: string;
    data: Omit<EmpenhoType, "tenant_id">;
    user: AuthenticatedUser;
  }) {
    const canEdit = new DomainAccessPolicy().can(
      user.role,
      "administrativo",
      "edit",
    );

    if (!canEdit) {
      throw new DomainError("User is not authorized to perform this action");
    }

    const existingEmpenho = await this.updateEmpenho.findByEmpenhoId(empenhoId);
    if (!existingEmpenho || existingEmpenho.tenant_id !== user.tenant_id) {
      throw new DomainError("Empenho not found");
    }

    if (data.contrato_id) {
      const contrato = await this.findContratoById.findById(data.contrato_id);

      if (!contrato || contrato.tenant_id !== user.tenant_id) {
        throw new DomainError("Contrato not found");
      }
    }

    if (existingEmpenho.status !== "CANCELADO") {
      const targetContratoId = data.contrato_id ?? existingEmpenho.contrato_id;
      const targetValue = data.value ?? existingEmpenho.value;
      const saldoDisponivel = await this.findContratoById.getSaldoDisponivel(targetContratoId, empenhoId);
      if (targetValue > saldoDisponivel) {
        throw new DomainError(
          `Empenho value (${targetValue}) exceeds contrato available balance (${saldoDisponivel})`,
        );
      }
    }

    return await this.updateEmpenho.update(empenhoId, { ...data, tenant_id: user.tenant_id });
  }
}
