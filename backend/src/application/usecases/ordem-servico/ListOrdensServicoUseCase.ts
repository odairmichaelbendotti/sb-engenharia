import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";

export class ListOrdensServicoUseCase {
  constructor(private repository: IOrdemServicoRepository) {}

  async execute(user: AuthenticatedUser) {
    if (user.role === "EMPRESA" && !user.company_id) {
      throw new DomainError("This user is not linked to a company");
    }

    const tenant_id =
      user.role === "PLATFORM_ADMIN" ? undefined : user.tenant_id;
    // EMPRESA só vê as OS cujo empenho principal é de contrato da própria empresa
    const company_id = user.role === "EMPRESA" ? user.company_id! : undefined;
    return this.repository.list(tenant_id, company_id);
  }
}
