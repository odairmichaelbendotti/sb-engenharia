import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { OrdemServicoEntity, type OrdemServicoType } from "../../../domain/entities/OrdemServico.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";
import type { IObraRepository } from "../../../domain/repositories/IObraRepository.js";
import { normalizeInput, ORDEM_SERVICO_RULES } from "../../../domain/normalization/input-rules.js";
import { OrdemServicoEmpenhosValidator } from "./OrdemServicoEmpenhosValidator.js";
import { OrdemServicoObraValidator } from "./OrdemServicoObraValidator.js";

export class CreateOrdemServicoUseCase {
  private empenhosValidator: OrdemServicoEmpenhosValidator;
  private obraValidator: OrdemServicoObraValidator;

  constructor(
    private repository: IOrdemServicoRepository,
    empenhoRepository: IEmpenhoRepository,
    obraRepository: IObraRepository,
  ) {
    this.empenhosValidator = new OrdemServicoEmpenhosValidator(empenhoRepository);
    this.obraValidator = new OrdemServicoObraValidator(obraRepository, repository);
  }

  async execute(input: Omit<OrdemServicoType, "tenant_id"> & { user: AuthenticatedUser }) {
    // Padroniza os textos antes de validar, buscar duplicados e gravar
    const { user, numero, empenhos, dataInicio, dataPrevisaoTermino, obra_id } = normalizeInput(
      input,
      ORDEM_SERVICO_RULES,
    );
    if (!numero || !empenhos?.length || !dataInicio || !dataPrevisaoTermino) {
      throw new DomainError("All fields are required");
    }

    const canEdit = new DomainAccessPolicy().canDo(user.role, "createOrdemServico");
    if (!canEdit) {
      throw new DomainError("You are not authorized to create an ordem de serviço");
    }

    const numeroAlreadyExists = await this.repository.verifyNumero(numero, user.tenant_id);
    if (numeroAlreadyExists) {
      throw new DomainError("Numero already exists");
    }

    const ordemServicoEntity = new OrdemServicoEntity({
      numero,
      empenhos,
      dataInicio,
      dataPrevisaoTermino,
      obra_id,
      tenant_id: user.tenant_id,
    });
    const vinculos = await this.empenhosValidator.validate({ user, empenhos: ordemServicoEntity.empenhos });
    await this.obraValidator.validate({ user, obraAnterior: null, obraNova: ordemServicoEntity.obra_id });

    return this.repository.create({
      numero: ordemServicoEntity.numero,
      tenant_id: user.tenant_id,
      empenhos: vinculos,
      dataInicio: new Date(ordemServicoEntity.dataInicio),
      dataPrevisaoTermino: new Date(ordemServicoEntity.dataPrevisaoTermino),
      obra_id: ordemServicoEntity.obra_id,
    });
  }
}
