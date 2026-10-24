import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { calcularPlanilhaMedicao } from "../../../domain/medicao/planilha-medicao.js";
import type { IMedicaoRepository } from "../../../domain/repositories/IMedicaoRepository.js";
import { loadOsDaMedicao, podeEditar } from "./medicao-access.js";
import { presentLinha, presentMedicaoResumo, presentTotaisMedicao } from "./medicao-presenter.js";

// Medição com a planilha linha a linha: a congelada na fechada, a do orçamento atual no rascunho
export class GetMedicaoUseCase {
  constructor(private repository: IMedicaoRepository) {}

  async execute({ medicaoId, user }: { medicaoId: string; user: AuthenticatedUser }) {
    const os = await loadOsDaMedicao(this.repository, medicaoId, user);
    const data = await this.repository.getDocumentData(medicaoId);
    // A empresa só vê as medições fechadas
    if (!data || (user.role === "EMPRESA" && data.medicao.status !== "FECHADA")) {
      throw new DomainError("Medição not found");
    }

    const { linhas, totais } = calcularPlanilhaMedicao(data.planilha);
    const editor = podeEditar(user) && os.tenant_id === user.tenant_id && os.status === "ATIVO";
    const rascunho = data.medicao.status === "RASCUNHO";
    return {
      ...presentMedicaoResumo(data.medicao, totais.valorEsta),
      ordemServico: { id: os.id, numero: os.numero, status: os.status },
      linhas: linhas.map(presentLinha),
      totais: presentTotaisMedicao(totais),
      fiscais: data.planilha.fiscais,
      permissoes: { editar: editor && rascunho, fechar: editor && rascunho, excluir: editor && rascunho },
    };
  }
}
