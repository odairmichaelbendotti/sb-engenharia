import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { EmpenhoType } from "../../../domain/entities/Empenho.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";

export class UpdateEmpenhoUseCase {
  constructor(
    private updateEmpenho: IEmpenhoRepository,
    private findCompanyById: ICompanyRepository,
  ) {}

  async execute({
    empenhoId,
    data,
    user,
  }: {
    empenhoId: string;
    data: EmpenhoType;
    user: AuthenticatedUser;
  }) {
    const canEdit = new DomainAccessPolicy().can(
      user.role,
      "administrativo",
      "edit",
    );

    if (!canEdit) {
      throw new DomainError("User is not authorized to perform this action");
    }

    if (data.company_id) {
      const company = await this.findCompanyById.findById(data.company_id);

      if (!company) {
        throw new DomainError("Company not found");
      }
    }

    return await this.updateEmpenho.update(empenhoId, data);
  }
}
