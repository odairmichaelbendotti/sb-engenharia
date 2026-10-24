import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { IMedicaoRepository } from "../../../domain/repositories/IMedicaoRepository.js";
import { assertPodeEditar, loadOsComAcesso, parseOrcamentoItens } from "./medicao-access.js";

// Grava a planilha orçamentária inteira; as regras contra o que já foi medido ficam no domínio
// (validateOrcamentoChange), conferidas pelo repository dentro da transação
export class SaveOrcamentoUseCase {
  constructor(private repository: IMedicaoRepository) {}

  async execute({ ordemServicoId, user, itens }: { ordemServicoId: string; user: AuthenticatedUser; itens: unknown }) {
    const os = await loadOsComAcesso(this.repository, ordemServicoId, user);
    assertPodeEditar(user, os);
    await this.repository.saveOrcamento({ ordemServico_id: os.id, itens: parseOrcamentoItens(itens) });
  }
}
