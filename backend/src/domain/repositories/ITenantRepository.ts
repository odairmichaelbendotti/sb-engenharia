import type { Tenant } from "../../generated/prisma/client.js";
import type { TenantType } from "../entities/Tenant.js";

export interface ITenantRepository {
  create(tenant: TenantType): Promise<Tenant>;
  findByCnpj(cnpj: string): Promise<Tenant | null>;
  findByApelido(apelido: string): Promise<Tenant | null>;
}
