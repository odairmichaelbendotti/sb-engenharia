import type { ITenantRepository } from "../../../domain/repositories/ITenantRepository.js";

export class GetMyTenantUseCase {
  constructor(private repository: ITenantRepository) {}

  async execute(tenant_id: string) {
    return this.repository.findById(tenant_id);
  }
}
