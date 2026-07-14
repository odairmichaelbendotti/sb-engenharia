import type { ITenantRepository } from "../../../domain/repositories/ITenantRepository.js";

export class ListTenantOptionsUseCase {
  constructor(private tenantRepository: ITenantRepository) {}
  async execute() {
    return await this.tenantRepository.getPublicOptions();
  }
}
