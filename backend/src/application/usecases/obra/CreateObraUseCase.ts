import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { ObraEntity, type ObraType } from "../../../domain/entities/Obra.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";
import type { IObraRepository } from "../../../domain/repositories/IObraRepository.js";
import { normalizeInput, OBRA_RULES } from "../../../domain/normalization/input-rules.js";

export class CreateObraUseCase {
  constructor(
    private repository: IObraRepository,
    private ordemServicoRepository: IOrdemServicoRepository,
  ) {}

  async execute(input: Omit<ObraType, "tenant_id"> & { user: AuthenticatedUser }) {
    // Padroniza os textos antes de validar, buscar duplicados e gravar
    const {
      user,
      nome,
      identificacaoPatrimonial,
      tipo,
      descricao,
      latitude,
      longitude,
      dataInicio,
      dataPrevisaoTermino,
      responsavelTecnico,
      anotacoes,
      ordemServico_id,
    } = normalizeInput(input, OBRA_RULES);
    if (
      !nome ||
      !identificacaoPatrimonial ||
      !tipo ||
      !dataInicio ||
      !dataPrevisaoTermino ||
      !responsavelTecnico ||
      !ordemServico_id
    ) {
      throw new DomainError(
        "Nome, identificacaoPatrimonial, tipo, datas, responsavelTecnico and ordemServico are required",
      );
    }

    const canEdit = new DomainAccessPolicy().can(user.role, "engenharia", "edit");
    if (!canEdit) {
      throw new DomainError("You are not authorized to create an obra");
    }

    const ordemServico = await this.ordemServicoRepository.findById(ordemServico_id);
    if (!ordemServico || ordemServico.tenant_id !== user.tenant_id) {
      throw new DomainError("Ordem de serviço not found");
    }

    const hasObraVinculada = await this.ordemServicoRepository.hasObraVinculada(ordemServico_id);
    if (hasObraVinculada) {
      throw new DomainError("Esta ordem de serviço já está vinculada a uma obra");
    }

    const obraEntity = new ObraEntity({
      nome,
      identificacaoPatrimonial,
      tipo,
      descricao,
      latitude,
      longitude,
      dataInicio,
      dataPrevisaoTermino,
      responsavelTecnico,
      anotacoes,
      tenant_id: user.tenant_id,
      ordemServico_id,
    });

    return this.repository.create(obraEntity);
  }
}
