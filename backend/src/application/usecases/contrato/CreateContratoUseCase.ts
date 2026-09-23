import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { ContratoEntity, type ContratoType } from "../../../domain/entities/Contrato.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IContratoRepository } from "../../../domain/repositories/IContratoRepository.js";
import type { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository.js";

export class CreateContratoUseCase {
  constructor(
    private repository: IContratoRepository,
    private companyRepository: ICompanyRepository,
  ) {}

  async execute({
    user,
    identificador,
    descricaoCurta,
    valor,
    dataInicio,
    dataFim,
    company_id,
  }: Omit<ContratoType, "tenant_id"> & { user: AuthenticatedUser }) {
    if (!identificador || !descricaoCurta || !valor || !dataInicio || !dataFim || !company_id) {
      throw new DomainError("All fields are required");
    }

    const canEdit = new DomainAccessPolicy().can(user.role, "administrativo", "edit");
    if (!canEdit) {
      throw new DomainError("You are not authorized to create a contrato");
    }

    const company = await this.companyRepository.findById(company_id);
    if (!company) {
      throw new DomainError("Company not found");
    }

    const identificadorAlreadyExists = await this.repository.verifyIdentificador(identificador, user.tenant_id);
    if (identificadorAlreadyExists) {
      throw new DomainError("Identificador already exists");
    }

    const contratoEntity = new ContratoEntity({
      identificador,
      descricaoCurta,
      valor,
      dataInicio,
      dataFim,
      company_id,
      tenant_id: user.tenant_id,
    });

    return this.repository.create({
      ...contratoEntity,
      // Math.round evita que erros de ponto flutuante quebrem o insert na coluna Int do Prisma.
      valor: Math.round(contratoEntity.valor * 100),
    });
  }
}
