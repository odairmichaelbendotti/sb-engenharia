import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { EmpenhoEntity, type EmpenhoType } from "../../../domain/entities/Empenho.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IContratoRepository } from "../../../domain/repositories/IContratoRepository.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";

export class CreateEmpenhoUseCase {
  constructor(
    private repository: IEmpenhoRepository,
    private contratoRepository: IContratoRepository,
  ) {}

  async execute({
    user,
    numero,
    description,
    category,
    startAt,
    endAt,
    value,
    contrato_id,
  }: Omit<EmpenhoType, "tenant_id"> & { user: AuthenticatedUser }) {
    if (!numero || !description || !category || !startAt || !endAt || !value || !contrato_id) {
      throw new DomainError("All fields are required");
    }

    const canEdit = new DomainAccessPolicy().can(
      user.role,
      "administrativo",
      "edit",
    );

    if (!canEdit) {
      throw new DomainError("You are not authorized to create an empenho");
    }

    const contrato = await this.contratoRepository.findById(contrato_id);
    if (!contrato || contrato.tenant_id !== user.tenant_id) {
      throw new DomainError("Contrato not found");
    }

    const empenhoEntity = new EmpenhoEntity({
      numero,
      description,
      category,
      startAt,
      endAt,
      value,
      contrato_id,
      tenant_id: user.tenant_id,
    });

    const saldoDisponivel = await this.contratoRepository.getSaldoDisponivel(contrato_id);
    if (empenhoEntity.value > saldoDisponivel) {
      throw new DomainError(
        `Empenho value (${empenhoEntity.value}) exceeds contrato available balance (${saldoDisponivel})`,
      );
    }

    return this.repository.create({
      ...empenhoEntity,
      // Math.round evita que erros de ponto flutuante (ex.: 0.55 * 100 = 55.00000000000001)
      // quebrem o insert na coluna Int do Prisma, que exige inteiro exato.
      value: Math.round(empenhoEntity.value * 100),
    });
  }
}
