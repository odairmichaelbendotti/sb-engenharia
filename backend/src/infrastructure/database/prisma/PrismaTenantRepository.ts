import type {
  PersistedTenant,
  TenantType,
} from "../../../domain/entities/Tenant.js";
import type { ITenantRepository } from "../../../domain/repositories/ITenantRepository.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { prisma } from "../../prisma/prisma.js";
import type { Tenant } from "../../../generated/prisma/client.js";

export class PrismaTenantRepository implements ITenantRepository {
  async create(tenant: TenantType): Promise<PersistedTenant> {
    try {
      return await prisma.tenant.create({
        data: tenant,
      });
    } catch (error) {
      throw new DomainError("Error creating tenant");
    }
  }
  async findByApelido(apelido: string): Promise<PersistedTenant | null> {
    try {
      return await prisma.tenant.findUnique({
        where: { apelido },
      });
    } catch (error) {
      throw new DomainError("Error finding tenant by apelido");
    }
  }
  async findByCnpj(cnpj: string): Promise<PersistedTenant | null> {
    try {
      return await prisma.tenant.findUnique({
        where: { cnpj },
      });
    } catch (error) {
      throw new DomainError("Error finding tenant by cnpj");
    }
  }
  async findById(id: string): Promise<PersistedTenant | null> {
    try {
      return await prisma.tenant.findUnique({
        where: { id },
      });
    } catch (error) {
      throw new DomainError("Error finding tenant by id");
    }
  }
  async getAll(): Promise<Tenant[]> {
    try {
      return await prisma.tenant.findMany();
    } catch (err) {
      throw new DomainError("Error getting tenants");
    }
  }
  async getPublicOptions(): Promise<Array<{ id: string; name: string }>> {
    try {
      return await prisma.tenant.findMany({
        select: { id: true, name: true },
      });
    } catch (err) {
      throw new DomainError("Error getting tenants");
    }
  }
}
