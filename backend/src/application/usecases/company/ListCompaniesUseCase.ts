import type { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository.js";
import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";

export class ListCompaniesUseCase {
  constructor(private repository: ICompanyRepository) {}

  async execute(user: AuthenticatedUser) {
    const tenant_id =
      user.role === "PLATFORM_ADMIN" ? undefined : user.tenant_id;
    return this.repository.list(tenant_id);
  }
}
