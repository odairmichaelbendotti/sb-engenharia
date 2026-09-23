import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { OrdemServicoEntity, type OrdemServicoType } from "../../../domain/entities/OrdemServico.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";

export class CreateOrdemServicoUseCase {
  constructor(
    private repository: IOrdemServicoRepository,
    private empenhoRepository: IEmpenhoRepository,
  ) {}

  async execute({
    user,
    numero,
    valor,
    empenho_id,
  }: Omit<OrdemServicoType, "tenant_id"> & { user: AuthenticatedUser }) {
    if (!numero || !valor || !empenho_id) {
      throw new DomainError("All fields are required");
    }

    const canEdit = new DomainAccessPolicy().can(user.role, "administrativo", "edit");
    if (!canEdit) {
      throw new DomainError("You are not authorized to create an ordem de serviço");
    }

    const empenho = await this.empenhoRepository.findByEmpenhoId(empenho_id);
    if (!empenho || empenho.tenant_id !== user.tenant_id) {
      throw new DomainError("Empenho not found");
    }

    const numeroAlreadyExists = await this.repository.verifyNumero(numero, user.tenant_id);
    if (numeroAlreadyExists) {
      throw new DomainError("Numero already exists");
    }

    const ordemServicoEntity = new OrdemServicoEntity({
      numero,
      valor,
      empenho_id,
      tenant_id: user.tenant_id,
    });

    const saldoDisponivel = await this.empenhoRepository.getSaldoDisponivel(empenho_id);
    if (ordemServicoEntity.valor > saldoDisponivel) {
      throw new DomainError(
        `OrdemServico valor (${ordemServicoEntity.valor}) exceeds empenho available balance (${saldoDisponivel})`,
      );
    }

    return this.repository.create({
      ...ordemServicoEntity,
      // Math.round evita que erros de ponto flutuante quebrem o insert na coluna Int do Prisma.
      valor: Math.round(ordemServicoEntity.valor * 100),
    });
  }
}
