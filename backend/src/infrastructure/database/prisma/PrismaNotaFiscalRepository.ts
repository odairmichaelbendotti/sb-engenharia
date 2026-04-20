import type { NotaFiscalType } from "../../../domain/entities/NotaFiscal";
import { DomainError } from "../../../domain/errors/DomainError";
import type {
  INotaFiscalRepository,
  listInvoices,
} from "../../../domain/repositories/INotaFiscalRepository";
import type { NotaFiscal } from "../../../generated/prisma/client";
import { prisma } from "../../prisma/prisma";

export class PrismaNotaFiscalRepository implements INotaFiscalRepository {
  async create(notaFiscal: NotaFiscalType): Promise<NotaFiscal> {
    try {
      const notaFiscalCreated = await prisma.notaFiscal.create({
        data: {
          numero: notaFiscal.numero,
          description: notaFiscal.description,
          vencimento: notaFiscal.vencimento,
          value: notaFiscal.value,
          empenho: { connect: { id: notaFiscal.empenho_id } },
          company: { connect: { id: notaFiscal.company_id } },
        },
        include: { company: true },
      });

      return notaFiscalCreated;
    } catch (error) {
      throw new DomainError("Erro ao criar nota fiscal");
    }
  }
  async findByNumber(number: string): Promise<NotaFiscal | null> {
    const notaFiscal = await prisma.notaFiscal.findFirst({
      where: {
        numero: number,
      },
    });
    console.log(notaFiscal);
    return notaFiscal;
  }
  async list(): Promise<listInvoices> {
    try {
      const [
        totalCount,
        totalValue,
        paidInvoices,
        paidValue,
        expiredCount,
        expiredValue,
        pendingInvoices,
        pendingValue,
        allInvoices,
      ] = await Promise.all([
        prisma.notaFiscal.count(),
        prisma.notaFiscal.aggregate({ _sum: { value: true } }),
        prisma.notaFiscal.count({ where: { status: "PAGO" } }),
        prisma.notaFiscal.aggregate({
          _sum: { value: true },
          where: { status: "PAGO" },
        }),
        prisma.notaFiscal.count({ where: { status: "VENCIDO" } }),
        prisma.notaFiscal.aggregate({
          _sum: { value: true },
          where: { status: "VENCIDO" },
        }),
        prisma.notaFiscal.count({ where: { status: "PENDENTE" } }),
        prisma.notaFiscal.aggregate({
          _sum: { value: true },
          where: { status: "PENDENTE" },
        }),
        prisma.notaFiscal.findMany({
          include: { company: true },
        }),
      ]);

      const parsedInvoices = allInvoices.map((invoice) => {
        return { ...invoice, value: invoice.value ? invoice.value / 100 : 0 };
      });

      return {
        totalCount,
        totalValue: (totalValue._sum.value ?? 0) / 100,
        paidInvoices,
        paidValue: (paidValue._sum.value ?? 0) / 100,
        expiredCount,
        expiredValue: (expiredValue._sum.value ?? 0) / 100,
        pendingInvoices,
        pendingValue: (pendingValue._sum.value ?? 0) / 100,
        allInvoices: parsedInvoices,
      };
    } catch (error) {
      throw new DomainError("Erro ao listar notas fiscais");
    }
  }
  async delete(id: string): Promise<void> {
    try {
      await prisma.notaFiscal.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      throw new DomainError("Erro ao deletar nota fiscal");
    }
  }
}
