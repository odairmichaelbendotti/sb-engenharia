import type { TenantType } from "../../../domain/entities/Tenant.js";
import type { ITenantRepository } from "../../../domain/repositories/ITenantRepository.js";
import type { Tenant } from "../../../generated/prisma/client.js";
import { prisma } from "../../prisma/prisma.js";

export class PrismaTenantRepository implements ITenantRepository {
  async create(tenant: TenantType): Promise<Tenant> {
    return await prisma.tenant.create({
      data: tenant,
    });
  }
  async findByApelido(apelido: string): Promise<Tenant | null> {
    return await prisma.tenant.findUnique({
      where: { apelido },
    });
  }
  async findByCnpj(cnpj: string): Promise<Tenant | null> {
    return await prisma.tenant.findUnique({
      where: { cnpj },
    });
  }
}
