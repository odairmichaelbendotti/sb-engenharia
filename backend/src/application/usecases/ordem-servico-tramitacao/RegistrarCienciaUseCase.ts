import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IOrdemServicoTramitacaoRepository } from "../../../domain/repositories/IOrdemServicoTramitacaoRepository.js";
import { isAguardandoCiencia } from "../../../domain/tramitacao/ciencia.js";
import { autorDe, loadInfoComAcesso, situacaoDe } from "./tramitacao-access.js";

// "Estou ciente": grava quem e quando (horário do servidor), uma vez por emissão
export class RegistrarCienciaUseCase {
  constructor(private repository: IOrdemServicoTramitacaoRepository) {}

  async execute({ ordemServicoId, user }: { ordemServicoId: string; user: AuthenticatedUser }) {
    if (!new DomainAccessPolicy().canDo(user.role, "darCienciaOrdemServico")) {
      throw new DomainError("You are not authorized to acknowledge this ordem de serviço");
    }
    const now = new Date();
    const info = await loadInfoComAcesso(this.repository, ordemServicoId, user);
    if (!isAguardandoCiencia(situacaoDe(info))) {
      throw new DomainError("This ordem de serviço is not awaiting acknowledgement");
    }

    // Ciência fora do prazo: o vencimento vai antes dela no histórico
    await this.repository.registrarPrazosVencidos({ ordemServico_id: info.id, now });
    const registrada = await this.repository.registrarCiencia({
      ordemServico_id: info.id,
      autor: autorDe(user, info.companyName),
      now,
    });
    if (!registrada) {
      throw new DomainError("This ordem de serviço was already acknowledged");
    }
    return { cienteEm: now };
  }
}
