import { TenantEntity, type TenantType } from "../../../domain/entities/Tenant.js";
import type { ITenantRepository } from "../../../domain/repositories/ITenantRepository.js";
import { normalizeInput, TENANT_RULES } from "../../../domain/normalization/input-rules.js";
import { DomainError } from "../../../domain/errors/DomainError.js";

export class CreateTenantUseCase {
  constructor(private tenantRepository: ITenantRepository) {}
  async execute(data: TenantType) {
    // Padroniza os textos antes de validar, buscar duplicados e gravar
    data = normalizeInput(data, TENANT_RULES);
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

    const tenantEntity = new TenantEntity(data);

    return this.tenantRepository.create(tenantEntity);
  }
}
