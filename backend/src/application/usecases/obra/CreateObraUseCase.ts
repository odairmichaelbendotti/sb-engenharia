import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { ObraEntity, type ObraType } from "../../../domain/entities/Obra.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";
import type { IObraRepository } from "../../../domain/repositories/IObraRepository.js";
import { normalizeInput, OBRA_RULES } from "../../../domain/normalization/input-rules.js";
import { ObraOrdensServicoValidator } from "./ObraOrdensServicoValidator.js";

export class CreateObraUseCase {
  private ordensServicoValidator: ObraOrdensServicoValidator;

  constructor(
    private repository: IObraRepository,
    ordemServicoRepository: IOrdemServicoRepository,
  ) {
    this.ordensServicoValidator = new ObraOrdensServicoValidator(ordemServicoRepository);
  }

  async execute(
    input: Omit<ObraType, "tenant_id"> & { user: AuthenticatedUser; ordemServicoIds: string[] },
  ) {
    // Padroniza os textos antes de validar, buscar duplicados e gravar
    const {
      user,
      nome,
      identificacaoPatrimonial,
      tipo,
      descricao,
      latitude,
      longitude,
      responsavelTecnico,
      anotacoes,
      ordemServicoIds,
    } = normalizeInput(input, OBRA_RULES);
    if (!nome || !identificacaoPatrimonial || !tipo || !responsavelTecnico) {
      throw new DomainError("Nome, identificacaoPatrimonial, tipo and responsavelTecnico are required");
    }

    const canEdit = new DomainAccessPolicy().can(user.role, "engenharia", "edit");
    if (!canEdit) {
      throw new DomainError("You are not authorized to create an obra");
    }

    // A obra nasce com ao menos uma OS; o cronograma vem delas
    const ids = await this.ordensServicoValidator.validate({ user, ordemServicoIds });

    const obraEntity = new ObraEntity({
      nome,
      identificacaoPatrimonial,
      tipo,
      descricao,
      latitude,
      longitude,
      responsavelTecnico,
      anotacoes,
      tenant_id: user.tenant_id,
    });

    return this.repository.create(obraEntity, ids);
  }
}
