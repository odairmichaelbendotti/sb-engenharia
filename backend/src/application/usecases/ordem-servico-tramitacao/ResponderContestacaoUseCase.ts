import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IOrdemServicoTramitacaoRepository } from "../../../domain/repositories/IOrdemServicoTramitacaoRepository.js";
import { autorDe, loadInfoComAcesso, normalizeTexto } from "./tramitacao-access.js";

const DECISOES = ["ACATADA", "RECUSADA"] as const;
type Decisao = (typeof DECISOES)[number];

// Fiscalização acata ou recusa um apontamento, com resposta obrigatória; a decisão é única
export class ResponderContestacaoUseCase {
  constructor(private repository: IOrdemServicoTramitacaoRepository) {}

  async execute({
    contestacaoId,
    user,
    decisao,
    resposta,
  }: {
    contestacaoId: string;
    user: AuthenticatedUser;
    decisao: unknown;
    resposta: unknown;
  }) {
    if (!new DomainAccessPolicy().canDo(user.role, "tramitarOrdemServico")) {
      throw new DomainError("You are not authorized to answer this contestação");
    }
    if (!DECISOES.includes(decisao as Decisao)) {
      throw new DomainError("Invalid decisão");
    }
    const normalized = normalizeTexto(resposta);

    const contestacao = await this.repository.findContestacao(contestacaoId);
    if (!contestacao) throw new DomainError("Contestação not found");
    await loadInfoComAcesso(this.repository, contestacao.ordemServico_id, user);
    if (contestacao.status !== "ABERTA") {
      throw new DomainError("This contestação was already answered");
    }

    const respondida = await this.repository.responderContestacao({
      contestacao_id: contestacao.id,
      autor: autorDe(user),
      decisao: decisao as Decisao,
      resposta: normalized,
      now: new Date(),
    });
    if (!respondida) throw new DomainError("This contestação was already answered");
  }
}
