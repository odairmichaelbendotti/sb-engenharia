import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IObraRepository } from "../../../domain/repositories/IObraRepository.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";
import { OrdemServicoObraValidator } from "./OrdemServicoObraValidator.js";

// Retira a OS da obra sem mexer no resto do cadastro. A obra continua existindo (pode ficar
// sem OS até receber outra); OS com notas fiscais não sai da obra
export class UnlinkObraOrdemServicoUseCase {
  private obraValidator: OrdemServicoObraValidator;

  constructor(
    private repository: IOrdemServicoRepository,
    obraRepository: IObraRepository,
  ) {
    this.obraValidator = new OrdemServicoObraValidator(obraRepository, repository);
  }

  async execute({ ordemServicoId, user }: { ordemServicoId: string; user: AuthenticatedUser }) {
    const canEdit = new DomainAccessPolicy().can(user.role, "administrativo", "edit");
    if (!canEdit) {
      throw new DomainError("User is not authorized to perform this action");
    }

    const existing = await this.repository.findById(ordemServicoId);
    if (!existing || existing.tenant_id !== user.tenant_id) {
      throw new DomainError("OrdemServico not found");
    }

    if (!existing.obra_id) {
      throw new DomainError("A ordem de serviço não está vinculada a nenhuma obra.");
    }

    await this.obraValidator.validate({
      user,
      ordemServicoId,
      obraAnterior: existing.obra_id,
      obraNova: null,
    });

    await this.repository.unlinkObra(ordemServicoId);
  }
}
