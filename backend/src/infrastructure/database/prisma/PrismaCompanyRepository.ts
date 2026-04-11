import type { CompanyEntity } from "../../../domain/entities/Company";
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
        throw new Error("Error creating company");
      }

      return newCompany;
    } catch (error) {
      throw new Error("Error creating company");
    }
  }
}
