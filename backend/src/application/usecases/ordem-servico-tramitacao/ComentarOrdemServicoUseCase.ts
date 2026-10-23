import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IOrdemServicoTramitacaoRepository } from "../../../domain/repositories/IOrdemServicoTramitacaoRepository.js";
import { podeEmpresaComentar, podeFiscalizacaoTramitar } from "../../../domain/tramitacao/ciencia.js";
import { autorDe, loadInfoComAcesso, normalizeTexto, situacaoDe } from "./tramitacao-access.js";

// Comentário no histórico, da empresa ou da fiscalização; o outro lado é avisado
export class ComentarOrdemServicoUseCase {
  private policy = new DomainAccessPolicy();

  constructor(private repository: IOrdemServicoTramitacaoRepository) {}

  async execute({ ordemServicoId, user, texto }: { ordemServicoId: string; user: AuthenticatedUser; texto: unknown }) {
    const daEmpresa = this.policy.canDo(user.role, "darCienciaOrdemServico");
    if (!daEmpresa && !this.policy.canDo(user.role, "tramitarOrdemServico")) {
      throw new DomainError("You are not authorized to comment on this ordem de serviço");
    }
    const normalized = normalizeTexto(texto);
    const info = await loadInfoComAcesso(this.repository, ordemServicoId, user);
    const situacao = situacaoDe(info);

    if (daEmpresa ? !podeEmpresaComentar(situacao, new Date()) : !podeFiscalizacaoTramitar(situacao)) {
      throw new DomainError("Comments are not allowed on this ordem de serviço now");
    }

    await this.repository.comentar({
      ordemServico_id: info.id,
      autor: autorDe(user, info.companyName),
      texto: normalized,
      daEmpresa,
    });
  }
}
