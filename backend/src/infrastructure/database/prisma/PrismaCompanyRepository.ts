import type {
  CompanyEntity,
  CompanyType,
  PersistedCompany,
} from "../../../domain/entities/Company.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type {
  CompanyWithTenantEmpenhos,
  ICompanyRepository,
  ListCompaniesResponse,
} from "../../../domain/repositories/ICompanyRepository.js";
import { prisma } from "../../prisma/prisma.js";

export class PrismaCompanyRepository implements ICompanyRepository {
  async create(company: CompanyEntity, tenant_id: string): Promise<PersistedCompany> {
    try {
      const newCompany = await prisma.company.create({
        data: {
          tenants: { create: { tenant_id } },
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
  async findByCnpj(cnpj: string): Promise<PersistedCompany | null> {
    try {
      return await prisma.company.findUnique({ where: { cnpj } });
    } catch (error) {
      throw new DomainError("Error finding company by cnpj: " + error);
    }
  }
  async isLinkedToTenant(company_id: string, tenant_id: string): Promise<boolean> {
    try {
      const link = await prisma.tenantCompany.findUnique({
        where: { tenant_id_company_id: { tenant_id, company_id } },
      });
      return link !== null;
    } catch (error) {
      throw new DomainError("Error verifying company link: " + error);
    }
  }
  async linkToTenant(company_id: string, tenant_id: string): Promise<void> {
    try {
      await prisma.tenantCompany.upsert({
        where: { tenant_id_company_id: { tenant_id, company_id } },
        create: { tenant_id, company_id },
        update: {},
      });
    } catch (error) {
      throw new DomainError("Error linking company: " + error);
    }
  }
  async unlinkFromTenant(company_id: string, tenant_id: string): Promise<void> {
    try {
      await prisma.tenantCompany.deleteMany({ where: { tenant_id, company_id } });
    } catch (error) {
      throw new DomainError("Error unlinking company: " + error);
    }
  }
  async countTenantLinks(company_id: string): Promise<number> {
    try {
      return await prisma.tenantCompany.count({ where: { company_id } });
    } catch (error) {
      throw new DomainError("Error counting company links: " + error);
    }
  }
  async hasContratosInTenant(company_id: string, tenant_id: string): Promise<boolean> {
    try {
      const count = await prisma.contrato.count({ where: { company_id, tenant_id } });
      return count > 0;
    } catch (error) {
      throw new DomainError("Error verifying company contratos: " + error);
    }
  }
  async list(tenant_id: string | undefined): Promise<ListCompaniesResponse> {
    // Sem tenant (PLATFORM_ADMIN) os filtros ficam vazios e trazem tudo
    const tenantFilter = tenant_id ? { tenant_id } : {};
    const companyFilter = tenant_id ? { tenants: { some: { tenant_id } } } : {};

    try {
      const [
        companies,
        totalCompanies,
        totalEmpenhos,
        totalEmpenhosActive,
        totalEmpenhosValue,
      ] = await Promise.all([
        prisma.company.findMany({
          where: companyFilter,
          include: {
            contratos: {
              where: tenantFilter,
              include: { empenhos: { where: tenantFilter } },
            },
          },
          orderBy: { name: "asc" },
        }),
        prisma.company.count({ where: companyFilter }),
        prisma.empenho.count({ where: tenantFilter }),
        prisma.empenho.count({ where: { ...tenantFilter, status: "ATIVO" } }),
        prisma.empenho.aggregate({ where: tenantFilter, _sum: { value: true } }),
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
  async listByTenant(
    tenant_id: string | undefined,
  ): Promise<CompanyWithTenantEmpenhos[]> {
    const tenantFilter = tenant_id ? { tenant_id } : {};

    try {
      const companies = await prisma.company.findMany({
        where: { contratos: { some: tenantFilter } },
        include: {
          contratos: {
            where: tenantFilter,
            include: { empenhos: { where: tenantFilter } },
          },
        },
        orderBy: { name: "asc" },
      });

      return companies.map(({ contratos, ...company }) => ({
        ...company,
        empenhos: contratos.flatMap((contrato) =>
          contrato.empenhos.map((empenho) => ({
            ...empenho,
            value: empenho.value / 100,
            totalPaid: empenho.totalPaid / 100,
          })),
        ),
      }));
    } catch (error) {
      throw new DomainError("Error listing companies by tenant: " + error);
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
