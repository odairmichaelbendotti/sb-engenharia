import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";
import { calcularPrazoCiencia } from "../../../domain/tramitacao/ciencia.js";
import { autorDe } from "../ordem-servico-tramitacao/tramitacao-access.js";

// Emite para a empresa a OS que aguardava o orçamento: a partir daqui ela vê a OS e tem o prazo de
// ciência. Exige o orçamento lançado e os empenhos somando o valor dele (salvar o orçamento acerta)
export class EmitirOrdemServicoUseCase {
  constructor(private repository: IOrdemServicoRepository) {}

  async execute({ ordemServicoId, user }: { ordemServicoId: string; user: AuthenticatedUser }) {
    if (!new DomainAccessPolicy().canDo(user.role, "createOrdemServico")) {
      throw new DomainError("You are not authorized to emit an ordem de serviço");
    }
    const os = await this.repository.findById(ordemServicoId);
    if (!os || os.tenant_id !== user.tenant_id) throw new DomainError("OrdemServico not found");
    if (!os.aguardandoEmissao) throw new DomainError("This ordem de serviço was already emitted");
    if (os.status !== "ATIVO") throw new DomainError("Only an active ordem de serviço can be emitted");

    const valorOrcamento = await this.repository.getValorOrcamento(os.id);
    if (valorOrcamento === null || valorOrcamento <= 0) {
      throw new DomainError("Lance o orçamento da OS antes de emiti-la.");
    }
    // OrdemServico.valor vem em reais
    if (Math.round(os.valor * 100) !== valorOrcamento) {
      throw new DomainError("Os empenhos da OS precisam somar o valor do orçamento. Salve o orçamento de novo.");
    }

    // Emissão no horário do servidor: a partir dela a empresa tem o prazo para dar ciência
    const emitidaEm = new Date();
    await this.repository.emitir(os.id, {
      tipo: "EMITIDA",
      emitidaEm,
      cienciaPrazoAte: calcularPrazoCiencia(emitidaEm),
      autor: autorDe(user),
    });
  }
}
