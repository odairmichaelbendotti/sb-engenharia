import type {
  CompanyEntity,
  CompanyType,
  PersistedCompany,
} from "../../../domain/entities/Company.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type {
  ICompanyRepository,
  ListCompaniesResponse,
} from "../../../domain/repositories/ICompanyRepository.js";
import { prisma } from "../../prisma/prisma.js";

export class PrismaCompanyRepository implements ICompanyRepository {
  async create(company: CompanyEntity): Promise<PersistedCompany> {
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
    } catch (error) {
      throw new DomainError("Error creating company: " + error);
    }
  }
  async verifyCnpj(cnpj: string): Promise<boolean> {
    try {
      const company = await prisma.company.findUnique({
        where: {
          cnpj,
        },
      });

      return company !== null;
    } catch (error) {
      throw new DomainError("Error verifying cnpj: " + error);
    }
  }
  async list(): Promise<ListCompaniesResponse> {
    try {
      const [
        companies,
        totalCompanies,
        totalEmpenhos,
        totalEmpenhosActive,
        totalEmpenhosValue,
      ] = await Promise.all([
        prisma.company.findMany({ include: { contratos: { include: { empenhos: true } } } }),
        prisma.company.count(),
        prisma.empenho.count(),
        prisma.empenho.count({ where: { status: "ATIVO" } }),
        prisma.empenho.aggregate({ _sum: { value: true } }),
      ]);

      // Empenho não pertence mais diretamente à Company (agora vive em Contrato) —
      // achatamos os empenhos de todos os contratos da empresa pra manter a mesma
      // forma que o frontend de Empresas já espera (company.empenhos).
      const companiesWithDividedValue = companies.map((company) => ({
        ...company,
        empenhos: company.contratos.flatMap((contrato) =>
          contrato.empenhos.map((empenho) => ({
            ...empenho,
            value: empenho.value / 100,
          })),
        ),
      }));

      return {
        companies: companiesWithDividedValue,
        stats: {
          totalCompanies,
          totalEmpenhos,
          totalEmpenhosActive,
          totalEmpenhosValue: totalEmpenhosValue._sum.value
            ? totalEmpenhosValue._sum.value / 100
            : 0,
        },
      };
    } catch (error) {
      throw new DomainError("Method not implemented." + error);
    }
  }
  async delete(id: string): Promise<void> {
    const contratos = await prisma.contrato.findMany({
      where: { company_id: id },
      select: { status: true },
    });

    if (contratos.length > 0) {
      const hasActive = contratos.some((contrato) => contrato.status === "ATIVO");
      throw new DomainError(
        hasActive
          ? "Não é possível excluir a empresa: existem contratos ativos vinculados a ela."
          : "Não é possível excluir a empresa: existem contratos vinculados a ela.",
      );
    }

    try {
      await prisma.company.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new DomainError("Company not found");
      }
      if (error.code === "P2003") {
        throw new DomainError(
          "Não é possível excluir a empresa: existem registros vinculados a ela.",
        );
      }
      throw new DomainError("Error deleting company: " + error);
    }
  }
  async findById(id: string): Promise<PersistedCompany | null> {
    try {
      const company = await prisma.company.findUnique({
        where: { id },
      });

      return company;
    } catch (error) {
      throw new DomainError("Error finding company: " + error);
    }
  }
  async update(id: string, company: CompanyType): Promise<PersistedCompany> {
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
      });
    } catch (error) {
      throw new DomainError("Error editing company: " + error);
    }
  }
}
