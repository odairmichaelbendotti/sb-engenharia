import type { CompanyEntity } from "../../../domain/entities/Company";
import { DomainError } from "../../../domain/errors/DomainError";
import type { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository";
import type { Company } from "../../../generated/prisma/client";
import { prisma } from "../../prisma/prisma";

export class PrismaCompanyRepository implements ICompanyRepository {
  async create(company: CompanyEntity): Promise<Company> {
    try {
      const newCompany = await prisma.company.create({
        data: {
          name: company.name,
          cnpj: company.cnpj,
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
    } catch (err) {
      throw new DomainError("Error verifying cnpj: " + err);
    }
  }
  async list(): Promise<Company[]> {
    throw new DomainError("Method not implemented.");
  }
}
