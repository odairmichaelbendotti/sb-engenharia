import { DomainError } from "../../../domain/errors/DomainError.js";
import type { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository.js";
import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";

export class DeleteCompanyUseCase {
  constructor(private repository: ICompanyRepository) {}

  // Remove a empresa só da organização do usuário; o cadastro global (CNPJ) só é
  // apagado quando nenhuma outra base usa mais a empresa
  async execute({ id, user }: { id: string; user: AuthenticatedUser }) {
    const isLinked = await this.repository.isLinkedToTenant(id, user.tenant_id);
    if (!isLinked) {
      throw new DomainError("Company not found");
    }

    const hasContratos = await this.repository.hasContratosInTenant(id, user.tenant_id);
    if (hasContratos) {
      throw new DomainError(
        "Não é possível excluir a empresa: existem contratos vinculados a ela.",
      );
    }

    await this.repository.unlinkFromTenant(id, user.tenant_id);

    const remainingLinks = await this.repository.countTenantLinks(id);
    if (remainingLinks === 0) {
      await this.repository.delete(id);
    }
  }
}
