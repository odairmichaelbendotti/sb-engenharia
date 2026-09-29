import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IObraRepository } from "../../../domain/repositories/IObraRepository.js";

export class GetObraDetailUseCase {
  constructor(private repository: IObraRepository) {}

  async execute({ id, user }: { id: string; user: AuthenticatedUser }) {
    if (user.role === "EMPRESA" && !user.company_id) {
      throw new DomainError("This user is not linked to a company");
    }

    // Mesmo escopo da listagem do mapa: tenant do usuário e, para EMPRESA, só a própria empresa
    const detail = await this.repository.getDetail(
      id,
      user.role === "PLATFORM_ADMIN" ? undefined : user.tenant_id,
      user.role === "EMPRESA" ? user.company_id! : undefined,
    );
    if (!detail) throw new DomainError("Obra not found");

    // Valores, saldos e notas fiscais pertencem ao domínio administrativo
    if (!new DomainAccessPolicy().can(user.role, "administrativo", "view")) {
      return { ...detail, financial: null };
    }
    return detail;
  }
}
