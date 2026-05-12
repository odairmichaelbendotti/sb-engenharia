import { DomainError } from "../../../domain/errors/DomainError.js";
import { prisma } from "../../prisma/prisma.js";
export class PrismaNotaFiscalRepository {
    async create(notaFiscal) {
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
        }
        catch (error) {
            throw new DomainError("Erro ao criar nota fiscal");
        }
    }
    async findByNumber(number) {
        const notaFiscal = await prisma.notaFiscal.findFirst({
            where: {
                numero: number,
            },
        });
        console.log(notaFiscal);
        return notaFiscal;
    }
    async list() {
        try {
            const [totalCount, totalValue, paidInvoices, paidValue, expiredCount, expiredValue, pendingInvoices, pendingValue, allInvoices,] = await Promise.all([
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
        }
        catch (error) {
            throw new DomainError("Erro ao listar notas fiscais");
        }
    }
    async delete(id) {
        try {
            await prisma.notaFiscal.delete({
                where: {
                    id,
                },
            });
        }
        catch (error) {
            throw new DomainError("Erro ao deletar nota fiscal");
        }
    }
    async update(notaFiscal, id) {
        const parsedInvoice = {
            ...notaFiscal,
            vencimento: new Date(notaFiscal.vencimento),
            value: notaFiscal.value * 100,
        };
        try {
            const updatedInvoice = await prisma.notaFiscal.update({
                where: { id },
                data: parsedInvoice,
                include: { company: true },
            });
            return updatedInvoice;
        }
        catch (error) {
            console.log(error);
            throw new DomainError("Erro ao atualizar nota fiscal");
        }
    }
}
//# sourceMappingURL=PrismaNotaFiscalRepository.js.map