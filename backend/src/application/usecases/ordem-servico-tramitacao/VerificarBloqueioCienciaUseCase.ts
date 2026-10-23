import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { IOrdemServicoTramitacaoRepository } from "../../../domain/repositories/IOrdemServicoTramitacaoRepository.js";

// Empresa com OS de ciência vencida fica travada (ver RequireCienciaEmDia); os outros perfis nunca
export class VerificarBloqueioCienciaUseCase {
  constructor(private repository: IOrdemServicoTramitacaoRepository) {}

  async execute(user: AuthenticatedUser): Promise<boolean> {
    if (user.role !== "EMPRESA" || !user.company_id) return false;
    const now = new Date();
    const escopo = { tenant_id: user.tenant_id, company_id: user.company_id };
    await this.repository.registrarPrazosVencidos({ ...escopo, now });
    return this.repository.hasCienciaVencida({ ...escopo, now });
  }
}
