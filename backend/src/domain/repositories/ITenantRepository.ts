import type { Tenant } from "../../generated/prisma/client.js";
import type { PersistedTenant, TenantType } from "../entities/Tenant.js";

export interface ITenantRepository {
  create(tenant: TenantType): Promise<PersistedTenant>;
  getAll(): Promise<Tenant[]>;
  getPublicOptions(): Promise<Array<{ id: string; name: string }>>;
  findByCnpj(cnpj: string): Promise<PersistedTenant | null>;
  findByApelido(apelido: string): Promise<PersistedTenant | null>;
  findById(id: string): Promise<PersistedTenant | null>;
}
