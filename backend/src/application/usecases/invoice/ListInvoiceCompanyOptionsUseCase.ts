import type { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository.js";
import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";

// Empresas selecionáveis ao lançar uma nota fiscal: só as que têm contrato com a
// organização do usuário, e só com os empenhos dessa organização
export class ListInvoiceCompanyOptionsUseCase {
  constructor(private companyRepository: ICompanyRepository) {}

  async execute(user: AuthenticatedUser) {
    const tenant_id =
      user.role === "PLATFORM_ADMIN" ? undefined : user.tenant_id;
    return await this.companyRepository.listByTenant(tenant_id);
  }
}
