import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { ContratoType } from "../../../domain/entities/Contrato.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository.js";
import type { IContratoRepository } from "../../../domain/repositories/IContratoRepository.js";

const DESCRICAO_CURTA_MAX_LENGTH = 20;

export class UpdateContratoUseCase {
  constructor(
    private repository: IContratoRepository,
    private companyRepository: ICompanyRepository,
  ) {}

  async execute({
    contratoId,
    data,
    user,
  }: {
    contratoId: string;
    data: Omit<ContratoType, "tenant_id">;
    user: AuthenticatedUser;
  }) {
    const canEdit = new DomainAccessPolicy().can(user.role, "administrativo", "edit");
    if (!canEdit) {
      throw new DomainError("User is not authorized to perform this action");
    }

    const existing = await this.repository.findById(contratoId);
    if (!existing || existing.tenant_id !== user.tenant_id) {
      throw new DomainError("Contrato not found");
    }

    if (data.descricaoCurta && data.descricaoCurta.length > DESCRICAO_CURTA_MAX_LENGTH) {
      throw new DomainError(`Contrato descricaoCurta must have at most ${DESCRICAO_CURTA_MAX_LENGTH} characters`);
    }

    if (data.company_id) {
      const company = await this.companyRepository.findById(data.company_id);
      if (!company) {
        throw new DomainError("Company not found");
      }
    }

    if (data.identificador && data.identificador !== existing.identificador) {
      const identificadorAlreadyExists = await this.repository.verifyIdentificador(
        data.identificador,
        user.tenant_id,
      );
      if (identificadorAlreadyExists) {
        throw new DomainError("Identificador already exists");
      }
    }

    return this.repository.update(contratoId, {
      ...data,
      valor: Math.round(data.valor * 100),
      tenant_id: existing.tenant_id,
    });
  }
}
