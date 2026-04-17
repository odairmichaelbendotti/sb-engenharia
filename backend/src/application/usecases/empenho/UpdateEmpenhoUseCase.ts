import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser";
import type { EmpenhoType } from "../../../domain/entities/Empenho";
import { DomainError } from "../../../domain/errors/DomainError";
import { AdminPolicy } from "../../../domain/polices/AdminPolicy";
import type { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository";

export class UpdateEmpenhoUseCase {
  constructor(
    private updateEmpenho: IEmpenhoRepository,
    private findCompanyById: ICompanyRepository,
  ) {}

  async execute(empenhoId: string, data: EmpenhoType, user: AuthenticatedUser) {
    const admin = new AdminPolicy().isAdmin(user);

    console.log("-----DATA ABAIXO------");
    console.log(data);

    try {
      if (!admin) {
        throw new Error("User is not authorized to perform this action");
      }

      if (data.company_id) {
        const company = await this.findCompanyById.findById(data.company_id);

        if (!company) {
          throw new Error("Company not found");
        }
      }

      return await this.updateEmpenho.update(empenhoId, data);
    } catch (error) {
      console.log(error);
      throw new DomainError("Failed to update empenho");
    }
  }
}
