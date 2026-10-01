import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type { IObraRepository } from "../../../domain/repositories/IObraRepository.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";

// Valida a troca da obra de uma OS: a nova obra precisa ser da organização, a obra
// anterior não pode ficar sem OS e uma OS com notas fiscais não pode ficar sem obra
// (as notas medem a execução da obra)
export class OrdemServicoObraValidator {
  constructor(
    private obraRepository: IObraRepository,
    private ordemServicoRepository: IOrdemServicoRepository,
  ) {}

  async validate({
    user,
    ordemServicoId,
    obraAnterior,
    obraNova,
  }: {
    user: AuthenticatedUser;
    ordemServicoId?: string;
    obraAnterior: string | null;
    obraNova: string | null;
  }): Promise<void> {
    if (obraAnterior === obraNova) return;

    if (obraNova) {
      const obra = await this.obraRepository.findById(obraNova);
      if (!obra || obra.tenant_id !== user.tenant_id) {
        throw new DomainError("Obra not found");
      }
    }

    if (!obraAnterior) return;

    const ordensDaObra = await this.obraRepository.findOrdemServicoIds(obraAnterior);
    if (ordensDaObra.length <= 1) {
      throw new DomainError(
        "A obra precisa ter ao menos uma ordem de serviço: vincule outra OS a ela antes de retirar esta.",
      );
    }

    if (!obraNova && ordemServicoId && (await this.ordemServicoRepository.hasInvoices(ordemServicoId))) {
      throw new DomainError(
        "Não é possível retirar a OS da obra: já existem notas fiscais lançadas nela.",
      );
    }
  }
}
