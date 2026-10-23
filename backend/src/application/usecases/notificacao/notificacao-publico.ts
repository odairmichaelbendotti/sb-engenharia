import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { NotificacaoPublico } from "../../../domain/repositories/INotificacaoRepository.js";

/** A empresa recebe os avisos dela; a fiscalização, os da organização; os demais perfis, nenhum. */
export function publicoDe(user: AuthenticatedUser): NotificacaoPublico | null {
  const policy = new DomainAccessPolicy();
  if (policy.canDo(user.role, "darCienciaOrdemServico")) {
    if (!user.company_id) throw new DomainError("This user is not linked to a company");
    return { destino: "EMPRESA", tenant_id: user.tenant_id, company_id: user.company_id };
  }
  if (policy.canDo(user.role, "tramitarOrdemServico")) {
    return { destino: "FISCALIZACAO", tenant_id: user.tenant_id };
  }
  return null;
}
