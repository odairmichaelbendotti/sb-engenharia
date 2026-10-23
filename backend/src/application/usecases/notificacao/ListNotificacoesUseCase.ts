import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { INotificacaoRepository } from "../../../domain/repositories/INotificacaoRepository.js";
import { publicoDe } from "./notificacao-publico.js";

const LIMIT = 30;

export class ListNotificacoesUseCase {
  constructor(private repository: INotificacaoRepository) {}

  async execute(user: AuthenticatedUser) {
    const publico = publicoDe(user);
    if (!publico) return { notificacoes: [], naoLidas: 0 };
    const [notificacoes, naoLidas] = await Promise.all([
      this.repository.list({ publico, user_id: user.id, limit: LIMIT }),
      this.repository.countNaoLidas({ publico, user_id: user.id }),
    ]);
    return { notificacoes, naoLidas };
  }
}
