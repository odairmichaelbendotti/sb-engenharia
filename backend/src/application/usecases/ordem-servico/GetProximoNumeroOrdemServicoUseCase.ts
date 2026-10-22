import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IOrdemServicoRepository } from "../../../domain/repositories/IOrdemServicoRepository.js";

// Mostra, antes de a OS ser criada, o número que ela receberá (o formulário revela esse número
// quando o contrato e o lote são escolhidos). Não reserva nada: o número definitivo sai na criação
export class GetProximoNumeroOrdemServicoUseCase {
  constructor(private repository: IOrdemServicoRepository) {}

  async execute({ user, lote_id, ano }: { user: AuthenticatedUser; lote_id: string | null; ano: number }) {
    if (!new DomainAccessPolicy().canDo(user.role, "createOrdemServico")) {
      throw new DomainError("You are not authorized to create an ordem de serviço");
    }
    if (!Number.isInteger(ano) || ano < 2000 || ano > 2999) {
      throw new DomainError("Invalid ano");
    }

    const numero = await this.repository.getProximoNumero({ tenant_id: user.tenant_id, lote_id, ano });
    return { numero };
  }
}
