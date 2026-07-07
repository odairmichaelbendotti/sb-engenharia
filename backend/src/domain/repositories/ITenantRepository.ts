import type { PersistedTenant, TenantType } from "../entities/Tenant.js";

export interface ITenantRepository {
  create(tenant: TenantType): Promise<PersistedTenant>;
  findByCnpj(cnpj: string): Promise<PersistedTenant | null>;
  findByApelido(apelido: string): Promise<PersistedTenant | null>;
  findById(id: string): Promise<PersistedTenant | null>;
}
