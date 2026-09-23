import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IContratoRepository } from "../../../domain/repositories/IContratoRepository.js";
import type {
  IEmpenhoRepository,
  UpdateStatusDTO,
} from "../../../domain/repositories/IEmpenhoRepository.js";

export class UpdateStatusEmpenhoUseCase {
  constructor(
    private repository: IEmpenhoRepository,
    private contratoRepository: IContratoRepository,
  ) {}

  async execute({
    empenhoId,
    status,
    user,
  }: {
    empenhoId: string;
    status: UpdateStatusDTO;
    user: AuthenticatedUser;
  }) {
    const canEdit = new DomainAccessPolicy().can(
      user.role,
      "administrativo",
      "edit",
    );
    if (!canEdit) throw new DomainError("User can't update empenho status");

    const existing = await this.repository.findByEmpenhoId(empenhoId);
    if (!existing || existing.tenant_id !== user.tenant_id) {
      throw new DomainError("Empenho not found");
    }

    // Um empenho CANCELADO não conta contra o saldo do contrato — ao reativá-lo
    // (voltar pra ATIVO/FINALIZADO), precisa recontar como se fosse um novo empenho,
    // senão dá pra estourar o saldo do contrato só cancelando e reativando.
    if (existing.status === "CANCELADO" && status !== "CANCELADO") {
      const saldoDisponivel = await this.contratoRepository.getSaldoDisponivel(existing.contrato_id, empenhoId);
      if (existing.value > saldoDisponivel) {
        throw new DomainError(
          `Cannot reactivate empenho: value (${existing.value}) exceeds contrato available balance (${saldoDisponivel})`,
        );
      }
    }

    return this.repository.updateStatus(empenhoId, status);
  }
}
