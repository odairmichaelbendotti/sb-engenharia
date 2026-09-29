import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { ContratoEntity, type ContratoType } from "../../../domain/entities/Contrato.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IContratoRepository } from "../../../domain/repositories/IContratoRepository.js";
import type { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository.js";
import { normalizeInput, CONTRATO_RULES } from "../../../domain/normalization/input-rules.js";

export class CreateContratoUseCase {
  constructor(
    private repository: IContratoRepository,
    private companyRepository: ICompanyRepository,
  ) {}

  async execute(input: Omit<ContratoType, "tenant_id"> & { user: AuthenticatedUser }) {
    // Padroniza os textos antes de validar, buscar duplicados e gravar
    const {
      user,
      identificador,
      descricaoCurta,
      valor,
      dataInicio,
      dataFim,
      company_id,
    } = normalizeInput(input, CONTRATO_RULES);
    if (!identificador || !descricaoCurta || !valor || !dataInicio || !dataFim || !company_id) {
      throw new DomainError("All fields are required");
    }

    const canEdit = new DomainAccessPolicy().can(user.role, "administrativo", "edit");
    if (!canEdit) {
      throw new DomainError("You are not authorized to create a contrato");
    }

    // Só empresas cadastradas para a organização do usuário
    const company = await this.companyRepository.findById(company_id);
    if (!company || !(await this.companyRepository.isLinkedToTenant(company_id, user.tenant_id))) {
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
