import type { IObraRepository } from "../../../domain/repositories/IObraRepository.js";

export class ListObrasUseCase {
  constructor(private repository: IObraRepository) {}

  async execute({
    tenant_id,
    company_id,
    includeInvoices,
  }: {
    tenant_id: string;
    company_id?: string;
    includeInvoices?: boolean;
  }) {
    return this.repository.list(tenant_id, company_id, includeInvoices);
  }
}
