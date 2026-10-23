import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IOrdemServicoTramitacaoRepository } from "../../../domain/repositories/IOrdemServicoTramitacaoRepository.js";
import {
  getFaseEmissao,
  isAguardandoCiencia,
  isCienciaDispensada,
  podeEmpresaComentar,
  podeEmpresaContestar,
  podeFiscalizacaoTramitar,
} from "../../../domain/tramitacao/ciencia.js";
import { autorDe, loadInfoComAcesso, situacaoDe } from "./tramitacao-access.js";

// Situação da ciência, histórico e apontamentos da OS, com o que o usuário pode fazer agora
export class GetOrdemServicoTramitacaoUseCase {
  private policy = new DomainAccessPolicy();

  constructor(private repository: IOrdemServicoTramitacaoRepository) {}

  async execute({ ordemServicoId, user }: { ordemServicoId: string; user: AuthenticatedUser }) {
    const now = new Date();
    let info = await loadInfoComAcesso(this.repository, ordemServicoId, user);

    if (!isCienciaDispensada(situacaoDe(info))) {
      // O vencimento entra no histórico na primeira leitura depois dele, com a hora do próprio prazo
      await this.repository.registrarPrazosVencidos({ ordemServico_id: info.id, now });
      // Abrir a OS pela empresa é a prova de que ela a viu
      if (user.role === "EMPRESA" && !info.visualizadaEm) {
        await this.repository.registrarVisualizacao({
          ordemServico_id: info.id,
          autor: autorDe(user, info.companyName),
          now,
        });
      }
      info = await loadInfoComAcesso(this.repository, ordemServicoId, user);
    }

    const situacao = situacaoDe(info);
    const [eventos, contestacoes] = await Promise.all([
      this.repository.listEventos(info.id),
      this.repository.listContestacoes(info.id),
    ]);
    const empresa = this.policy.canDo(user.role, "darCienciaOrdemServico");
    // A fiscalização só tramita OS da própria organização (o PLATFORM_ADMIN só acompanha)
    const fiscalizacao = this.policy.canDo(user.role, "tramitarOrdemServico") && info.tenant_id === user.tenant_id;

    return {
      situacao: {
        fase: getFaseEmissao(situacao, now),
        emitidaEm: info.emitidaEm,
        cienciaPrazoAte: info.cienciaPrazoAte,
        visualizadaEm: info.visualizadaEm,
        cienteEm: info.cienteEm,
        cienteNome: info.cienteNome,
        contestacoesAbertas: info.contestacoesAbertas,
        // Relógio do servidor, para a tela calcular o tempo restante sem depender do relógio local
        serverNow: now,
      },
      permissoes: {
        darCiencia: empresa && isAguardandoCiencia(situacao),
        contestar: empresa && podeEmpresaContestar(situacao, now),
        comentar: empresa ? podeEmpresaComentar(situacao, now) : fiscalizacao && podeFiscalizacaoTramitar(situacao),
        responder: fiscalizacao && podeFiscalizacaoTramitar(situacao),
      },
      eventos,
      contestacoes,
    };
  }
}
