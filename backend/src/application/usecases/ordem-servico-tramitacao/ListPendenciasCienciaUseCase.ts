import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";
import type { IOrdemServicoTramitacaoRepository } from "../../../domain/repositories/IOrdemServicoTramitacaoRepository.js";
import { isCienciaVencida } from "../../../domain/tramitacao/ciencia.js";
import { situacaoDe } from "./tramitacao-access.js";

// OS da empresa aguardando ciência, completas para a tela de pendências (que funciona mesmo travada)
export class ListPendenciasCienciaUseCase {
  constructor(
    private repository: IOrdemServicoTramitacaoRepository,
    private ordemServicoRepository: IOrdemServicoRepository,
  ) {}

  async execute(user: AuthenticatedUser) {
    const now = new Date();
    if (user.role !== "EMPRESA") return { bloqueada: false, serverNow: now, pendencias: [] };
    if (!user.company_id) throw new DomainError("This user is not linked to a company");

    const escopo = { tenant_id: user.tenant_id, company_id: user.company_id };
    await this.repository.registrarPrazosVencidos({ ...escopo, now });
    const aguardando = await this.repository.listAguardandoCiencia(escopo);
    if (aguardando.length === 0) return { bloqueada: false, serverNow: now, pendencias: [] };

    const { ordensServico } = await this.ordemServicoRepository.list(user.tenant_id, user.company_id);
    const porId = new Map(ordensServico.map((os) => [os.id, os]));
    const pendencias = aguardando.flatMap((info) => {
      const ordemServico = porId.get(info.id);
      if (!ordemServico) return [];
      return [{ ordemServico, cienciaPrazoAte: info.cienciaPrazoAte!, vencida: isCienciaVencida(situacaoDe(info), now) }];
    });

    return { bloqueada: pendencias.some((p) => p.vencida), serverNow: now, pendencias };
  }
}
