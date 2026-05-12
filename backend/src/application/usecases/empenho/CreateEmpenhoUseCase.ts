import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { EmpenhoType } from "../../../domain/entities/Empenho.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { AdminPolicy } from "../../../domain/polices/AdminPolicy.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";

export class CreateEmpenhoUseCase {
  constructor(private repository: IEmpenhoRepository) {}

  async execute(
    user: AuthenticatedUser,
    { numero, description, startAt, endAt, value, company_id }: EmpenhoType,
  ) {
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

    // const existingEmpenho = await this.repository.findByEmpenhoId(numero);

    // if (existingEmpenho) {
    //   throw new DomainError("Empenho already exists");
    // }

    return this.repository.create({
      numero,
      description,
      startAt,
      endAt,
      value: value * 100,
      company_id,
    });
  }
}
