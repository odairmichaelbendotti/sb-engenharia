import { DomainError } from "../../../domain/errors/DomainError.js";
import { AdminPolicy } from "../../../domain/polices/AdminPolicy.js";
export class UpdateEmpenhoUseCase {
    updateEmpenho;
    findCompanyById;
    constructor(updateEmpenho, findCompanyById) {
        this.updateEmpenho = updateEmpenho;
        this.findCompanyById = findCompanyById;
    }
    async execute(empenhoId, data, user) {
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
        }
        catch (error) {
            console.log(error);
            throw new DomainError("Failed to update empenho");
        }
    }
}
//# sourceMappingURL=UpdateEmpenhoUseCase.js.map