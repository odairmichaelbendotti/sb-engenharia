import {
  CompanyEntity,
  type CompanyType,
  type PersistedCompany,
} from "../entities/Company.js";
import type { PersistedEmpenho } from "../entities/Empenho.js";

export type ListCompaniesResponse = {
  companies: (PersistedCompany & { empenhos: PersistedEmpenho[] })[];
  stats: {
    totalCompanies: number;
    totalEmpenhos: number;
    totalEmpenhosActive: number;
    totalEmpenhosValue: number;
  };
};

/** Empresa com os empenhos que ela possui dentro de um tenant (via contratos daquele tenant). */
export type CompanyWithTenantEmpenhos = PersistedCompany & {
  empenhos: PersistedEmpenho[];
};

export interface ICompanyRepository {
  /** Cria a empresa já vinculada ao tenant que a cadastrou. */
  create(company: CompanyEntity, tenant_id: string): Promise<PersistedCompany>;
  verifyCnpj(cnpj: string): Promise<boolean>;
  findByCnpj(cnpj: string): Promise<PersistedCompany | null>;
  /** Empresas vinculadas ao tenant. `tenant_id` undefined = todas (PLATFORM_ADMIN). */
  list(tenant_id: string | undefined): Promise<ListCompaniesResponse>;
  isLinkedToTenant(company_id: string, tenant_id: string): Promise<boolean>;
  linkToTenant(company_id: string, tenant_id: string): Promise<void>;
  unlinkFromTenant(company_id: string, tenant_id: string): Promise<void>;
  countTenantLinks(company_id: string): Promise<number>;
  hasContratosInTenant(company_id: string, tenant_id: string): Promise<boolean>;
  /**
   * Empresas que têm contrato com o tenant, cada uma só com os empenhos desse tenant.
   * `tenant_id` undefined = todos os tenants (PLATFORM_ADMIN).
   */
  listByTenant(tenant_id: string | undefined): Promise<CompanyWithTenantEmpenhos[]>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<PersistedCompany | null>;
  update(id: string, company: CompanyType): Promise<PersistedCompany>;
}
