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

  // A nota soma na execução da obra: a obra precisa ser de uma OS financiada por este
  // empenho, senão uma nota inflaria a execução de outra obra (ou de outra organização).
  // Se o empenho financia alguma obra, a nota precisa dizer de qual obra é.
  async validateObra(empenho_id: string, obra_id?: string | null): Promise<void> {
    if (!obra_id) {
      if (await this.obraRepository.empenhoHasObra(empenho_id)) {
        throw new DomainError("Informe a obra da nota fiscal: este empenho financia obras.");
      }
      return;
    }

    const obraEmpenhoIds = await this.obraRepository.findEmpenhoIds(obra_id);
    if (!obraEmpenhoIds) {
      throw new DomainError("Obra not found");
    }
    if (!obraEmpenhoIds.includes(empenho_id)) {
      throw new DomainError("Obra does not belong to this empenho");
    }
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
