import type { TenantType } from "../../../domain/entities/Tenant.js";
import type { ITenantRepository } from "../../../domain/repositories/ITenantRepository.js";
import { DomainError } from "../../../domain/errors/DomainError.js";

export class CreateTenantUseCase {
  constructor(private tenantRepository: ITenantRepository) {}
  async execute(data: TenantType) {
    const apelidoInUse = await this.tenantRepository.findByApelido(
      data.apelido,
    );

    if (apelidoInUse) {
      throw new DomainError("APELIDO_ALREADY_IN_USE");
    }

    const cnpjInUse = await this.tenantRepository.findByCnpj(data.cnpj);

    if (cnpjInUse) {
      throw new DomainError("CNPJ_ALREADY_IN_USE");
    }

    return this.tenantRepository.create(data);
  }
}
