import { DomainError } from "../../../domain/errors/DomainError.js";
import type { PersistedEmpenho } from "../../../domain/entities/Empenho.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";
import type { IContratoRepository } from "../../../domain/repositories/IContratoRepository.js";
import type { IInvoiceRepository } from "../../../domain/repositories/IInvoiceRepository.js";
import type { IObraRepository } from "../../../domain/repositories/IObraRepository.js";
import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";

// Garante que o empenho da nota é da organização do usuário e que a empresa
// informada é a mesma do contrato desse empenho
export class InvoiceScopeValidator {
  constructor(
    private empenhoRepository: IEmpenhoRepository,
    private contratoRepository: IContratoRepository,
    private invoiceRepository: IInvoiceRepository,
    private obraRepository: IObraRepository,
  ) {}

  // A nota soma na execução da obra e da OS: a OS precisa ser financiada por este empenho
  // e estar na obra informada, senão uma nota inflaria a execução de outra obra (ou de
  // outra organização). Se o empenho financia alguma obra, a nota precisa dizer de qual
  // obra/OS é; com só a obra informada, a OS é deduzida quando a obra tem uma só OS no empenho.
  async resolveObra({
    empenho,
    obra_id,
    ordemServico_id,
  }: {
    empenho: PersistedEmpenho;
    obra_id?: string | null | undefined;
    ordemServico_id?: string | null | undefined;
  }): Promise<{ obra_id: string | null; ordemServico_id: string | null }> {
    const opcoes = await this.obraRepository.listOptionsForInvoice(empenho.tenant_id, empenho.id);

    if (ordemServico_id) {
      const opcao = opcoes.find((o) => o.ordemServico.id === ordemServico_id);
      if (!opcao) {
        throw new DomainError("Ordem de serviço does not belong to this empenho");
      }
      if (obra_id && obra_id !== opcao.id) {
        throw new DomainError("Ordem de serviço does not belong to this obra");
      }
      return { obra_id: opcao.id, ordemServico_id };
    }

    if (!obra_id) {
      if (opcoes.length > 0) {
        throw new DomainError("Informe a obra da nota fiscal: este empenho financia obras.");
      }
      return { obra_id: null, ordemServico_id: null };
    }

    const daObra = opcoes.filter((o) => o.id === obra_id);
    if (daObra.length === 0) {
      throw new DomainError("Obra does not belong to this empenho");
    }
    if (daObra.length > 1) {
      throw new DomainError("Informe a ordem de serviço da nota fiscal: esta obra tem mais de uma OS neste empenho.");
    }
    return { obra_id, ordemServico_id: daObra[0]!.ordemServico.id };
  }

  // Nota existente precisa ser da organização do usuário (editar/excluir)
  async validateOwnership(user: AuthenticatedUser, invoice_id: string): Promise<void> {
    const tenant_id = await this.invoiceRepository.findTenantId(invoice_id);

    if (!tenant_id || tenant_id !== user.tenant_id) {
      throw new DomainError("Invoice not found");
    }
  }

  async validate(
    user: AuthenticatedUser,
    empenho_id: string,
    company_id: string,
  ): Promise<PersistedEmpenho> {
    const empenho = await this.empenhoRepository.findByEmpenhoId(empenho_id);

    if (!empenho) {
      throw new DomainError("Empenho not found");
    }

    if (user.role !== "PLATFORM_ADMIN" && empenho.tenant_id !== user.tenant_id) {
      throw new DomainError("Empenho not found");
    }

    const contrato = await this.contratoRepository.findById(empenho.contrato_id);

    if (!contrato || contrato.company_id !== company_id) {
      throw new DomainError("Empresa não corresponde ao contrato do empenho");
    }

    return empenho;
  }
}
