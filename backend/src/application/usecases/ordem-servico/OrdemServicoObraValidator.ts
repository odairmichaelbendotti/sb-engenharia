import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type { IObraRepository } from "../../../domain/repositories/IObraRepository.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";

// Valida a troca da obra de uma OS: a nova obra precisa ser da organização e uma OS com
// notas fiscais não pode ficar sem obra (as notas medem a execução da obra). A obra
// anterior pode ficar sem OS: assim a OS pode ser desvinculada e depois excluída
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

    if (!obraNova && ordemServicoId && (await this.ordemServicoRepository.hasInvoices(ordemServicoId))) {
      throw new DomainError(
        "Não é possível retirar a OS da obra: já existem notas fiscais lançadas nela.",
      );
    }
  }
}
