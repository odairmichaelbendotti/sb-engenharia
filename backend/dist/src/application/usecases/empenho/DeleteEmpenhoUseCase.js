import { AdminPolicy } from "../../../domain/polices/AdminPolicy.js";
export class DeleteEmpenhoUseCase {
    deleteEmpenho;
    constructor(deleteEmpenho) {
        this.deleteEmpenho = deleteEmpenho;
    }
    async execute({ user, empenhoId }) {
        const isAdmin = new AdminPolicy().isAdmin(user);
        if (!isAdmin) {
            throw new Error("User is not authorized to perform this action");
        }
        await this.deleteEmpenho.delete(empenhoId);
    }
}
//# sourceMappingURL=DeleteEmpenhoUseCase.js.map