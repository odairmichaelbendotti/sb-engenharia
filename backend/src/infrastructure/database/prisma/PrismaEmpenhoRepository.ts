import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository";
import type { EmpenhoType } from "../../../domain/entities/Empenho";
import type { Empenho } from "../../../generated/prisma/client";
import { prisma } from "../../prisma/prisma";
import { DomainError } from "../../../domain/errors/DomainError";

export class PrismaEmpenhoRepository implements IEmpenhoRepository {
  async create(empenho: EmpenhoType): Promise<Empenho> {
    try {
      const empenhoCreated = await prisma.empenho.create({
        data: {
          numero: empenho.numero,
          description: empenho.description,
          startAt: empenho.startAt,
          endAt: empenho.endAt,
          value: empenho.value,
          company_id: empenho.company_id,
        },
      });

      return empenhoCreated;
    } catch (error) {
      throw new DomainError("Error creating empenho");
    }
  }
  async findByNumber(number: string): Promise<Empenho | null> {
    try {
      const empenho = await prisma.empenho.findFirst({
        where: { numero: number },
      });

      return empenho;
    } catch (error) {
      throw new DomainError("Error finding empenho");
    }
  }
}
