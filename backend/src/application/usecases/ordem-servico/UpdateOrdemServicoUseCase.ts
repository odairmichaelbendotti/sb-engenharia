import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { OrdemServicoEntity, type OrdemServicoType } from "../../../domain/entities/OrdemServico.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";
import type { IObraRepository } from "../../../domain/repositories/IObraRepository.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";
import { normalizeInput, ORDEM_SERVICO_RULES } from "../../../domain/normalization/input-rules.js";
import { OrdemServicoEmpenhosValidator } from "./OrdemServicoEmpenhosValidator.js";
import { OrdemServicoObraValidator } from "./OrdemServicoObraValidator.js";

export class UpdateOrdemServicoUseCase {
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

  async execute({
    ordemServicoId,
    data,
    user,
  }: {
    ordemServicoId: string;
    // obra_id undefined = mantém a obra atual; null = retira a OS da obra
    data: Omit<OrdemServicoType, "tenant_id">;
    user: AuthenticatedUser;
  }) {
    // Padroniza os textos antes de validar, buscar duplicados e gravar
    data = normalizeInput(data, ORDEM_SERVICO_RULES);
    const canEdit = new DomainAccessPolicy().can(user.role, "administrativo", "edit");
    if (!canEdit) {
      throw new DomainError("User is not authorized to perform this action");
    }

    const existing = await this.repository.findById(ordemServicoId);
    if (!existing || existing.tenant_id !== user.tenant_id) {
      throw new DomainError("OrdemServico not found");
    }

    const numero = data.numero || existing.numero;
    if (numero !== existing.numero) {
      const numeroAlreadyExists = await this.repository.verifyNumero(numero, user.tenant_id);
      if (numeroAlreadyExists) {
        throw new DomainError("Numero already exists");
      }
    }

    const ordemServicoEntity = new OrdemServicoEntity({
      numero,
      empenhos: data.empenhos ?? [],
      dataInicio: data.dataInicio || existing.dataInicio?.toISOString() || "",
      dataPrevisaoTermino: data.dataPrevisaoTermino || existing.dataPrevisaoTermino?.toISOString() || "",
      obra_id: data.obra_id === undefined ? existing.obra_id : data.obra_id,
      tenant_id: existing.tenant_id,
    });

    // Empenho só sai da OS se nenhuma nota fiscal desta OS foi lançada nele
    const novosIds = new Set(ordemServicoEntity.empenhos.map((e) => e.empenho_id));
    const atuais = await this.repository.listVinculos(ordemServicoId);
    for (const removido of atuais.filter((vinculo) => !novosIds.has(vinculo.empenho_id))) {
      if (await this.repository.hasInvoicesForEmpenho(ordemServicoId, removido.empenho_id)) {
        throw new DomainError(
          `Não é possível remover o empenho ${removido.numero}: já existem notas fiscais desta OS lançadas nele.`,
        );
      }
    }

    const vinculos = await this.empenhosValidator.validate({
      user,
      empenhos: ordemServicoEntity.empenhos,
      ordemServicoId,
    });
    await this.obraValidator.validate({
      user,
      ordemServicoId,
      obraAnterior: existing.obra_id,
      obraNova: ordemServicoEntity.obra_id,
    });

    return this.repository.update(ordemServicoId, {
      numero: ordemServicoEntity.numero,
      empenhos: vinculos,
      dataInicio: new Date(ordemServicoEntity.dataInicio),
      dataPrevisaoTermino: new Date(ordemServicoEntity.dataPrevisaoTermino),
      obra_id: ordemServicoEntity.obra_id,
    });
  }
}
