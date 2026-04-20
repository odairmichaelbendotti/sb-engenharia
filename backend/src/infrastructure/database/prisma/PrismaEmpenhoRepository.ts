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
        where: { id: empenhoId },
      });

      return empenho;
    } catch (error) {
      console.log(error);
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

      const formattedEmpenhos = empenhos.map(
        (
          empenho: Empenho & {
            company: { id: string; name: string; cnpj: string };
          },
        ) => {
          return {
            ...empenho,
            value: Number(empenho.value) / 100,
            totalPaid: Number(empenho.totalPaid) / 100,
          };
        },
      );

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
  async update(empenhoId: string, empenho: EmpenhoType): Promise<Empenho> {
    try {
      return await prisma.empenho.update({
        where: { id: empenhoId },
        data: {
          numero: empenho.numero,
          value: empenho.value * 100,
          company_id: empenho.company_id,
          description: empenho.description,
          startAt: new Date(formatDate(empenho.startAt)),
          endAt: new Date(formatDate(empenho.endAt)),
        },
      });
    } catch (error) {
      console.log(error);
      throw new DomainError("Error updating empenho");
    }
  }
  async updateStatus(
    empenhoId: string,
    status: "ATIVO" | "FINALIZADO" | "CANCELADO",
  ): Promise<Empenho> {
    try {
      console.log(status);
      const empenho = await prisma.empenho.update({
        where: { id: empenhoId },
        data: {
          status: status,
        },
      });
      return empenho;
    } catch (error) {
      console.log(error);
      throw new DomainError("Error updating empenho status");
    }
  }
  async incrementInvoiceValue(empenhoId: string, value: number): Promise<void> {
    try {
      await prisma.empenho.update({
        where: { id: empenhoId },
        data: {
          totalPaid: {
            increment: value * 100,
          },
        },
      });
    } catch (error) {
      throw new Error("Error incrementing invoice value");
    }
  }
}
