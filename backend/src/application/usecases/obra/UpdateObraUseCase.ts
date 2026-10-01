import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { ObraType } from "../../../domain/entities/Obra.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import { normalizeInput, OBRA_RULES } from "../../../domain/normalization/input-rules.js";
import type { IObraRepository } from "../../../domain/repositories/IObraRepository.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";
import { ObraOrdensServicoValidator } from "./ObraOrdensServicoValidator.js";

type UpdateObraUseCaseRequest = {
  id: string;
  obra: Omit<ObraType, "tenant_id">;
  // Ausente = mantém as OS atuais; presente = passa a ser exatamente esse conjunto
  ordemServicoIds?: string[] | undefined;
  user: AuthenticatedUser;
};

export class UpdateObraUseCase {
  private ordensServicoValidator: ObraOrdensServicoValidator;

  constructor(
    private repository: IObraRepository,
    ordemServicoRepository: IOrdemServicoRepository,
  ) {
    this.ordensServicoValidator = new ObraOrdensServicoValidator(ordemServicoRepository);
  }

  async execute({ id, obra, ordemServicoIds, user }: UpdateObraUseCaseRequest) {
    // Padroniza os textos antes de validar, buscar duplicados e gravar
    obra = normalizeInput(obra, OBRA_RULES);
    const existing = await this.repository.findById(id);
    if (!existing || existing.tenant_id !== user.tenant_id) {
      throw new DomainError("Obra not found");
    }

    const canEdit = new DomainAccessPolicy().can(user.role, "engenharia", "edit");
    if (!canEdit) {
      throw new DomainError("You are not authorized to update an obra");
    }

    const ids = ordemServicoIds
      ? await this.ordensServicoValidator.validate({
          user,
          obraId: id,
          ordemServicoIds,
          atuais: await this.repository.findOrdemServicoIds(id),
        })
      : undefined;

    return this.repository.update(id, { ...obra, tenant_id: existing.tenant_id }, ids);
  }
}
