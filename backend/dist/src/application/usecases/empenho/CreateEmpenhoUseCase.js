import { DomainError } from "../../../domain/errors/DomainError.js";
import { AdminPolicy } from "../../../domain/polices/AdminPolicy.js";
export class CreateEmpenhoUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute(user, { numero, description, startAt, endAt, value, company_id }) {
        if (!numero ||
            !description ||
            !startAt ||
            !endAt ||
            !value ||
            !company_id) {
            throw new DomainError("All fields are required");
        }
        const isAdmin = new AdminPolicy().isAdmin(user);
        if (!isAdmin) {
            throw new DomainError("You are not authorized to create an empenho");
        }
        // const existingEmpenho = await this.repository.findByEmpenhoId(numero);
        // if (existingEmpenho) {
        //   throw new DomainError("Empenho already exists");
        // }
        return this.repository.create({
            numero,
            description,
            startAt,
            endAt,
            value: value * 100,
            company_id,
        });
    }
}
//# sourceMappingURL=CreateEmpenhoUseCase.js.map