import { DomainError } from "../../../domain/errors/DomainError.js";
import { AdminPolicy } from "../../../domain/polices/AdminPolicy.js";
export class UpdateStatusEmpenhoUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute(empenhoId, status, user) {
        const isAdmin = new AdminPolicy().isAdmin(user);
        if (!isAdmin)
            throw new DomainError("User can't update empenho status");
        return this.repository.updateStatus(empenhoId, status);
    }
}
//# sourceMappingURL=UpdateEmpenhoStatusUseCase.js.map