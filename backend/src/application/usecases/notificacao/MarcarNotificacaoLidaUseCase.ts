import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type { INotificacaoRepository } from "../../../domain/repositories/INotificacaoRepository.js";
import { publicoDe } from "./notificacao-publico.js";

// Sem id marca todas as do usuário como lidas
export class MarcarNotificacaoLidaUseCase {
  constructor(private repository: INotificacaoRepository) {}

  async execute({ user, notificacaoId }: { user: AuthenticatedUser; notificacaoId: string | null }) {
    const publico = publicoDe(user);
    if (!publico) throw new DomainError("Notificação not found");
    if (notificacaoId) {
      await this.repository.marcarLida({ publico, user_id: user.id, notificacao_id: notificacaoId });
    } else {
      await this.repository.marcarTodasLidas({ publico, user_id: user.id });
    }
  }
}
