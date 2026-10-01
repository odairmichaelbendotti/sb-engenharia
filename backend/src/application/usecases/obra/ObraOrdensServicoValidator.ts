import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";

// Valida o conjunto de OS de uma obra: ao menos uma, todas da organização, nenhuma já
// vinculada a outra obra e nenhuma OS com notas fiscais retirada (as notas medem a execução)
export class ObraOrdensServicoValidator {
  constructor(private ordemServicoRepository: IOrdemServicoRepository) {}

  async validate({
    user,
    obraId,
    ordemServicoIds,
    atuais = [],
  }: {
    user: AuthenticatedUser;
    // Ausente na criação
    obraId?: string;
    ordemServicoIds: string[];
    // OS vinculadas hoje à obra (edição)
    atuais?: string[];
  }): Promise<string[]> {
    const ids = [...new Set(ordemServicoIds.filter(Boolean))];
    if (ids.length === 0) {
      throw new DomainError("A obra precisa ter ao menos uma ordem de serviço.");
    }

    for (const id of ids.filter((id) => !atuais.includes(id))) {
      const ordemServico = await this.ordemServicoRepository.findById(id);
      if (!ordemServico || ordemServico.tenant_id !== user.tenant_id) {
        throw new DomainError("Ordem de serviço not found");
      }
      if (ordemServico.obra_id && ordemServico.obra_id !== obraId) {
        throw new DomainError(`A ordem de serviço ${ordemServico.numero} já está vinculada a outra obra.`);
      }
    }

    for (const id of atuais.filter((id) => !ids.includes(id))) {
      if (await this.ordemServicoRepository.hasInvoices(id)) {
        const ordemServico = await this.ordemServicoRepository.findById(id);
        throw new DomainError(
          `Não é possível retirar a ordem de serviço ${ordemServico?.numero ?? ""} da obra: já existem notas fiscais lançadas nela.`,
        );
      }
    }

    return ids;
  }
}
