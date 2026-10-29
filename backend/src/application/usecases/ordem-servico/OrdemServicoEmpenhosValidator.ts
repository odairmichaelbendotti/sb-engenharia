import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { OrdemServicoEmpenhoInput } from "../../../domain/entities/OrdemServico.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";

// Valida os empenhos de uma OS: todos da organização do usuário, do mesmo contrato
// e com saldo livre para o valor destinado. Devolve os valores em centavos.
// A OS planejada não reserva saldo: o saldo dela é conferido na emissão.
export class OrdemServicoEmpenhosValidator {
  constructor(private empenhoRepository: IEmpenhoRepository) {}

  async validate({
    user,
    empenhos,
    ordemServicoId,
    reservaSaldo = true,
  }: {
    user: AuthenticatedUser;
    empenhos: OrdemServicoEmpenhoInput[];
    // Na edição, o que a própria OS já usa do empenho não conta como comprometido
    ordemServicoId?: string;
    // false na OS planejada
    reservaSaldo?: boolean;
  }): Promise<{ empenho_id: string; valor: number }[]> {
    let contratoId: string | null = null;
    const vinculos: { empenho_id: string; valor: number }[] = [];

    for (const vinculo of empenhos) {
      const empenho = await this.empenhoRepository.findByEmpenhoId(vinculo.empenho_id);
      if (!empenho || empenho.tenant_id !== user.tenant_id) {
        throw new DomainError("Empenho not found");
      }

      if (contratoId && empenho.contrato_id !== contratoId) {
        throw new DomainError("Todos os empenhos da ordem de serviço precisam ser do mesmo contrato.");
      }
      contratoId = empenho.contrato_id;

      // Compara em centavos para não esbarrar em erro de ponto flutuante
      const valorCentavos = Math.round(vinculo.valor * 100);
      const saldo = reservaSaldo ? await this.empenhoRepository.getSaldoDisponivel(vinculo.empenho_id, ordemServicoId) : 0;
      if (reservaSaldo && valorCentavos > Math.round(saldo * 100)) {
        throw new DomainError(
          `O valor destinado do empenho ${empenho.numero} (${vinculo.valor}) excede o saldo disponível dele (${saldo}).`,
        );
      }

      vinculos.push({ empenho_id: vinculo.empenho_id, valor: valorCentavos });
    }

    return vinculos;
  }
}
