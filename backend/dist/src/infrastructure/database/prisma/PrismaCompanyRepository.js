import { DomainError } from "../../../domain/errors/DomainError.js";
import { prisma } from "../../prisma/prisma.js";
export class PrismaCompanyRepository {
    async create(company) {
        try {
            const newCompany = await prisma.company.create({
                data: {
                    name: company.name,
                    cnpj: company.cnpj,
                    cep: company.cep,
                    city: company.city,
                    state: company.state,
                    address: company.address,
                    phone: company.phone,
                    email: company.email,
                },
            });
            if (!newCompany) {
                throw new Error("Error creating company (newCompany is null)");
            }
            return newCompany;
        }
        catch (error) {
            throw new DomainError("Error creating company: " + error);
        }
    }
    async verifyCnpj(cnpj) {
        try {
            const company = await prisma.company.findUnique({
                where: {
                    cnpj,
                },
            });
            return company !== null;
        }
        catch (error) {
            throw new DomainError("Error verifying cnpj: " + error);
        }
    }
    async list() {
        try {
            const [companies, totalCompanies, totalEmpenhos, totalEmpenhosActive, totalEmpenhosValue,] = await Promise.all([
                prisma.company.findMany({ include: { empenhos: true } }),
                prisma.company.count(),
                prisma.empenho.count(),
                prisma.empenho.count({ where: { status: "ATIVO" } }),
                prisma.empenho.aggregate({ _sum: { value: true } }),
            ]);
            return {
                companies,
                stats: {
                    totalCompanies,
                    totalEmpenhos,
                    totalEmpenhosActive,
                    totalEmpenhosValue: totalEmpenhosValue._sum.value
                        ? totalEmpenhosValue._sum.value / 100
                        : 0,
                },
            };
        }
        catch (error) {
            throw new DomainError("Method not implemented." + error);
        }
    }
    async delete(id) {
        try {
            await prisma.company.delete({
                where: { id },
            });
        }
        catch (error) {
            if (error.code === "P2025") {
                throw new DomainError("Company not found");
            }
            throw new DomainError("Error deleting company: " + error);
        }
    }
    async findById(id) {
        try {
            const company = await prisma.company.findUnique({
                where: { id },
            });
            return company;
        }
        catch (error) {
            throw new DomainError("Error finding company: " + error);
        }
    }
    async update(id, company) {
        try {
            return await prisma.company.update({
                where: { id },
                data: {
                    cnpj: company.cnpj,
                    email: company.email,
                    phone: company.phone,
                    address: company.address,
                    city: company.city,
                    state: company.state,
                    name: company.name,
                    updatedAt: new Date(),
                },
                include: { empenhos: true },
            });
        }
        catch (error) {
            throw new DomainError("Error editing company: " + error);
        }
    }
}
//# sourceMappingURL=PrismaCompanyRepository.js.map