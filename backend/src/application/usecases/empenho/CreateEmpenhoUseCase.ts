import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { EmpenhoEntity, type EmpenhoType } from "../../../domain/entities/Empenho.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { AdminPolicy } from "../../../domain/polices/AdminPolicy.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";

export class CreateEmpenhoUseCase {
  constructor(private repository: IEmpenhoRepository) {}

  async execute({
    user,
    numero,
    description,
    startAt,
    endAt,
    value,
    company_id,
  }: EmpenhoType & { user: AuthenticatedUser }) {
    if (
      !numero ||
      !description ||
      !startAt ||
      !endAt ||
      !value ||
      !company_id
    ) {
      throw new DomainError("All fields are required");
    }

    const isAdmin = new AdminPolicy().isAdmin(user);

    if (!isAdmin) {
      throw new DomainError("You are not authorized to create an empenho");
    }

    const empenhoEntity = new EmpenhoEntity({
      numero,
      description,
      startAt,
      endAt,
      value,
      company_id,
    });

    return this.repository.create({
      ...empenhoEntity,
      value: empenhoEntity.value * 100,
    });
  }
}
