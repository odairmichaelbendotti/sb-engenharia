import type { EmpenhoType } from "../../domain/entities/Empenho";
import { DomainError } from "../../domain/errors/DomainError";
import type { IEmpenhoRepository } from "../../domain/repositories/IEmpenhoRepository";

export class EmpenhoUseCase {
  constructor(private repository: IEmpenhoRepository) {}

  async execute({
    numero,
    description,
    startAt,
    endAt,
    value,
    company_id,
  }: EmpenhoType) {
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

    const existingEmpenho = await this.repository.findByNumber(numero);

    if (existingEmpenho) {
      throw new DomainError("Empenho already exists");
    }

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
