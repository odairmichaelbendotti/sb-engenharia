import type {
  empenhosDTO,
  IEmpenhoRepository,
} from "../../../domain/repositories/IEmpenhoRepository";
import type { EmpenhoType } from "../../../domain/entities/Empenho";
import type { Empenho } from "../../../generated/prisma/client";
import { prisma } from "../../prisma/prisma";
import { DomainError } from "../../../domain/errors/DomainError";
import { formatDate } from "../../../utils/formatDateToInsertDb";

export class PrismaEmpenhoRepository implements IEmpenhoRepository {
  async create(empenho: EmpenhoType): Promise<Empenho> {
    try {
      const empenhoCreated = await prisma.empenho.create({
        data: {
          numero: empenho.numero,
          description: empenho.description,
          startAt: new Date(formatDate(empenho.startAt)),
          endAt: new Date(formatDate(empenho.endAt)),
          value: empenho.value,
          company_id: empenho.company_id,
        },
      });

      return empenhoCreated;
    } catch (error) {
      console.log(error);
      throw new DomainError("Error creating empenho");
    }
  }
  async findByEmpenhoId(empenhoId: string): Promise<Empenho | null> {
    try {
      const empenho = await prisma.empenho.findUnique({
        where: { numero: empenhoId },
      });

      return empenho;
    } catch (error) {
      throw new DomainError("Error finding empenho");
    }
  }
  async list(): Promise<empenhosDTO> {
    try {
      const [
        empenhos,
        totalEmpenhos,
        totalEmpenhosAmount,
        activeEmpenhos,
        activeEmpenhosAmount,
        completedEmpenhos,
        completedEmpenhosAmount,
      ] = await Promise.all([
        prisma.empenho.findMany({
          include: {
            company: {
              select: {
                id: true,
                name: true,
                cnpj: true,
              },
            },
          },
        }),
        prisma.empenho.count(),
        prisma.empenho.aggregate({ _sum: { value: true } }),
        prisma.empenho.count({ where: { status: "ATIVO" } }),
        prisma.empenho.aggregate({
          where: { status: "ATIVO" },
          _sum: { value: true },
        }),
        prisma.empenho.count({ where: { status: "FINALIZADO" } }),
        prisma.empenho.aggregate({
          where: { status: "FINALIZADO" },
          _sum: { value: true },
        }),
      ]);

      const formattedEmpenhos = empenhos.map((empenho) => {
        return {
          ...empenho,
          value: empenho.value / 100,
        };
      });

      const mergedData = {
        empenhos: formattedEmpenhos,
        totalEmpenhos,
        totalEmpenhosAmount: (totalEmpenhosAmount._sum.value || 0) / 100,
        activeEmpenhos,
        activeEmpenhosAmount: (activeEmpenhosAmount._sum.value || 0) / 100,
        completedEmpenhos,
        completedEmpenhosAmount:
          (completedEmpenhosAmount._sum.value || 0) / 100,
      };

      return mergedData;
    } catch (error) {
      throw new DomainError("Error listing empenhos");
    }
  }
  async delete(empenhoId: string): Promise<void> {
    try {
      await prisma.empenho.delete({
        where: { id: empenhoId },
      });
    } catch (error) {
      throw new DomainError("Error deleting empenho");
    }
  }
}
