import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IOrdemServicoTramitacaoRepository } from "../../../domain/repositories/IOrdemServicoTramitacaoRepository.js";
import { podeEmpresaContestar } from "../../../domain/tramitacao/ciencia.js";
import { autorDe, loadInfoComAcesso, normalizeTexto, situacaoDe } from "./tramitacao-access.js";

// Apontamento da empresa sobre a OS, dentro da janela de ciência
export class CriarContestacaoUseCase {
  constructor(private repository: IOrdemServicoTramitacaoRepository) {}

  async execute({ ordemServicoId, user, texto }: { ordemServicoId: string; user: AuthenticatedUser; texto: unknown }) {
    if (!new DomainAccessPolicy().canDo(user.role, "darCienciaOrdemServico")) {
      throw new DomainError("You are not authorized to contest this ordem de serviço");
    }
    const normalized = normalizeTexto(texto);
    const info = await loadInfoComAcesso(this.repository, ordemServicoId, user);
    if (!podeEmpresaContestar(situacaoDe(info), new Date())) {
      throw new DomainError("The period to contest this ordem de serviço is over");
    }

    await this.repository.criarContestacao({
      ordemServico_id: info.id,
      autor: autorDe(user, info.companyName),
      texto: normalized,
    });
  }
}
