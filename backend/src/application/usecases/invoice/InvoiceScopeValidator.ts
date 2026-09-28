import { DomainError } from "../../../domain/errors/DomainError.js";
import type { PersistedEmpenho } from "../../../domain/entities/Empenho.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";
import type { IContratoRepository } from "../../../domain/repositories/IContratoRepository.js";
import type { IInvoiceRepository } from "../../../domain/repositories/IInvoiceRepository.js";
import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";

// Garante que o empenho da nota é da organização do usuário e que a empresa
// informada é a mesma do contrato desse empenho
export class InvoiceScopeValidator {
  constructor(
    private empenhoRepository: IEmpenhoRepository,
    private contratoRepository: IContratoRepository,
    private invoiceRepository: IInvoiceRepository,
  ) {}

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
