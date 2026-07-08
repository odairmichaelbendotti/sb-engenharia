import type { ITenantRepository } from "../../../domain/repositories/ITenantRepository.js";

export class GetTenantsUseCase {
  constructor(private tenantRepository: ITenantRepository) {}
  async execute() {
    return await this.tenantRepository.getAll();
  }
}
