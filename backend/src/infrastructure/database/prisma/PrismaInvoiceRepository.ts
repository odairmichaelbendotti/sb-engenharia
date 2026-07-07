import type {
  InvoiceType,
  PersistedInvoice,
} from "../../../domain/entities/Invoice.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type {
  IInvoiceRepository,
  listInvoices,
} from "../../../domain/repositories/IInvoiceRepository.js";
import { prisma } from "../../prisma/prisma.js";

export class PrismaInvoiceRepository implements IInvoiceRepository {
  async create(invoice: InvoiceType): Promise<PersistedInvoice> {
    try {
      const invoiceCreated = await prisma.invoice.create({
        data: {
          numero: invoice.numero,
          description: invoice.description,
          vencimento: invoice.vencimento,
          value: invoice.value,
          empenho: { connect: { id: invoice.empenho_id } },
          company: { connect: { id: invoice.company_id } },
        },
        include: { company: true },
      });

      return invoiceCreated;
    } catch (error) {
      throw new DomainError("Erro ao criar nota fiscal");
    }
  }
  async findByNumber(number: string): Promise<PersistedInvoice | null> {
    const invoice = await prisma.invoice.findFirst({
      where: {
        numero: number,
      },
    });
    return invoice;
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
        prisma.invoice.count(),
        prisma.invoice.aggregate({ _sum: { value: true } }),
        prisma.invoice.count({ where: { status: "PAGO" } }),
        prisma.invoice.aggregate({
          _sum: { value: true },
          where: { status: "PAGO" },
        }),
        prisma.invoice.count({ where: { status: "VENCIDO" } }),
        prisma.invoice.aggregate({
          _sum: { value: true },
          where: { status: "VENCIDO" },
        }),
        prisma.invoice.count({ where: { status: "PENDENTE" } }),
        prisma.invoice.aggregate({
          _sum: { value: true },
          where: { status: "PENDENTE" },
        }),
        prisma.invoice.findMany({
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
      await prisma.invoice.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      throw new DomainError("Erro ao deletar nota fiscal");
    }
  }
  async update(invoice: InvoiceType, id: string): Promise<InvoiceType> {
    const parsedInvoice = {
      ...invoice,
      vencimento: new Date(invoice.vencimento),
      value: invoice.value * 100,
    };

    try {
      const updatedInvoice = await prisma.invoice.update({
        where: { id },
        data: parsedInvoice,
        include: { company: true },
      });
      return updatedInvoice;
    } catch (error) {
      throw new DomainError("Erro ao atualizar nota fiscal");
    }
  }
}
