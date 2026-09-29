import type {
  InvoiceType,
  PersistedInvoice,
  UpdateInvoiceType,
} from "../../../domain/entities/Invoice.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type {
  IInvoiceRepository,
  InvoiceSummaryByTenant,
  listInvoices,
} from "../../../domain/repositories/IInvoiceRepository.js";
import { prisma } from "../../prisma/prisma.js";
import type { TransactionClient } from "../../../generated/prisma/internal/prismaNamespace.js";

// Valores trafegam em reais entre as camadas e são gravados em centavos (Int).
// Toda conversão da nota fiscal acontece aqui, na entrada e na saída do repositório.
function toCents(reais: number): number {
  return Math.round(reais * 100);
}

function withValueInReais<T extends { value: number }>(invoice: T): T {
  return { ...invoice, value: invoice.value / 100 };
}

// Totais derivados das notas são sempre recalculados (soma das notas não canceladas),
// em vez de incrementados, para nunca divergirem após edição, cancelamento ou exclusão:
// - Empenho.totalPaid: quanto do empenho já foi liquidado
// - Obra.valorExecutado: execução liquidada da obra (e, por consequência, da sua OS)
async function syncInvoiceTotals(
  tx: TransactionClient,
  { empenhoIds, obraIds }: { empenhoIds: string[]; obraIds: (string | null)[] },
) {
  for (const empenho_id of new Set(empenhoIds)) {
    const agg = await tx.invoice.aggregate({
      where: { empenho_id, status: { not: "CANCELADO" } },
      _sum: { value: true },
    });
    await tx.empenho.update({
      where: { id: empenho_id },
      data: { totalPaid: agg._sum.value ?? 0 },
    });
  }

  for (const obra_id of new Set(obraIds)) {
    if (!obra_id) continue;
    const agg = await tx.invoice.aggregate({
      where: { obra_id, status: { not: "CANCELADO" } },
      _sum: { value: true },
    });
    await tx.obra.update({
      where: { id: obra_id },
      data: { valorExecutado: agg._sum.value ?? 0 },
    });
  }
}

export class PrismaInvoiceRepository implements IInvoiceRepository {
  async create(invoice: InvoiceType): Promise<PersistedInvoice> {
    try {
      const invoiceCreated = await prisma.$transaction(async (tx) => {
        const created = await tx.invoice.create({
          data: {
            numero: invoice.numero,
            description: invoice.description,
            vencimento: invoice.vencimento,
            value: toCents(invoice.value),
            empenho: { connect: { id: invoice.empenho_id } },
            company: { connect: { id: invoice.company_id } },
            ...(invoice.obra_id ? { obra: { connect: { id: invoice.obra_id } } } : {}),
          },
          include: { company: true },
        });
        await syncInvoiceTotals(tx, { empenhoIds: [created.empenho_id], obraIds: [created.obra_id] });
        return created;
      });

      return withValueInReais(invoiceCreated);
    } catch (error) {
      throw new DomainError("Erro ao criar nota fiscal");
    }
  }
  async sumActiveValueByEmpenho(empenho_id: string, excludeInvoiceId?: string): Promise<number> {
    try {
      const agg = await prisma.invoice.aggregate({
        where: {
          empenho_id,
          status: { not: "CANCELADO" },
          ...(excludeInvoiceId ? { id: { not: excludeInvoiceId } } : {}),
        },
        _sum: { value: true },
      });
      return (agg._sum.value ?? 0) / 100;
    } catch (error) {
      throw new DomainError("Error summing invoices: " + error);
    }
  }
  async findByNumber(number: string): Promise<PersistedInvoice | null> {
    const invoice = await prisma.invoice.findFirst({
      where: {
        numero: { equals: number, mode: "insensitive" },
      },
    });
    return invoice;
  }
  async findTenantId(id: string): Promise<string | null> {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        select: { empenho: { select: { tenant_id: true } } },
      });
      return invoice?.empenho.tenant_id ?? null;
    } catch (error) {
      throw new DomainError("Error finding invoice: " + error);
    }
  }
  async list(tenant_id?: string): Promise<listInvoices> {
    try {
      const tenantFilter = tenant_id ? { empenho: { tenant_id } } : {};

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
        prisma.invoice.count({ where: tenantFilter }),
        prisma.invoice.aggregate({
          where: tenantFilter,
          _sum: { value: true },
        }),
        prisma.invoice.count({ where: { ...tenantFilter, status: "PAGO" } }),
        prisma.invoice.aggregate({
          _sum: { value: true },
          where: { ...tenantFilter, status: "PAGO" },
        }),
        prisma.invoice.count({
          where: { ...tenantFilter, status: "VENCIDO" },
        }),
        prisma.invoice.aggregate({
          _sum: { value: true },
          where: { ...tenantFilter, status: "VENCIDO" },
        }),
        prisma.invoice.count({
          where: { ...tenantFilter, status: "PENDENTE" },
        }),
        prisma.invoice.aggregate({
          _sum: { value: true },
          where: { ...tenantFilter, status: "PENDENTE" },
        }),
        prisma.invoice.findMany({
          where: tenantFilter,
          include: { company: true },
        }),
      ]);

      const parsedInvoices = allInvoices.map((invoice) => {
        return withValueInReais(invoice);
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
  async summaryByTenant(): Promise<InvoiceSummaryByTenant[]> {
    try {
      const invoices = await prisma.invoice.findMany({
        where: { status: { in: ["PENDENTE", "VENCIDO"] } },
        select: { value: true, empenho: { select: { tenant_id: true } } },
      });

      const byTenant = new Map<string, InvoiceSummaryByTenant>();
      for (const inv of invoices) {
        const tenant_id = inv.empenho.tenant_id;
        const entry = byTenant.get(tenant_id) ?? {
          tenant_id,
          pendentesVencidasCount: 0,
          pendentesVencidasValor: 0,
        };
        entry.pendentesVencidasCount += 1;
        entry.pendentesVencidasValor += inv.value / 100;
        byTenant.set(tenant_id, entry);
      }

      return Array.from(byTenant.values());
    } catch (error) {
      throw new DomainError("Erro ao resumir notas fiscais por tenant");
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        const deleted = await tx.invoice.delete({ where: { id } });
        await syncInvoiceTotals(tx, { empenhoIds: [deleted.empenho_id], obraIds: [deleted.obra_id] });
      });
    } catch (error) {
      throw new DomainError("Erro ao deletar nota fiscal");
    }
  }
  async update(invoice: UpdateInvoiceType, id: string): Promise<PersistedInvoice> {
    try {
      const updatedInvoice = await prisma.$transaction(async (tx) => {
        const previous = await tx.invoice.findUniqueOrThrow({
          where: { id },
          select: { empenho_id: true, obra_id: true },
        });
        // Campos listados explicitamente: o corpo da requisição não pode alterar id, datas de auditoria etc.
        const updated = await tx.invoice.update({
          where: { id },
          data: {
            numero: invoice.numero,
            description: invoice.description,
            vencimento: new Date(invoice.vencimento),
            value: toCents(invoice.value),
            empenho_id: invoice.empenho_id,
            company_id: invoice.company_id,
            obra_id: invoice.obra_id ?? null,
            ...(invoice.status ? { status: invoice.status } : {}),
          },
          include: { company: true },
        });
        // Nota pode ter trocado de empenho ou de obra: recalcula os antigos e os novos
        await syncInvoiceTotals(tx, {
          empenhoIds: [previous.empenho_id, updated.empenho_id],
          obraIds: [previous.obra_id, updated.obra_id],
        });
        return updated;
      });
      return withValueInReais(updatedInvoice);
    } catch (error) {
      throw new DomainError("Erro ao atualizar nota fiscal");
    }
  }
}
