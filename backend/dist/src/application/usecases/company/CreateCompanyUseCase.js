import { DomainError } from "../../../domain/errors/DomainError.js";
export class CreateCompanyUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute({ name, cnpj, cep, city, state, address, phone, email, }) {
        if (!name ||
            !cnpj ||
            !cep ||
            !city ||
            !state ||
            !address ||
            !phone ||
            !email) {
            throw new DomainError("All fields are required");
        }
        const cnpjAlreadyExists = await this.repository.verifyCnpj(cnpj);
        if (cnpjAlreadyExists) {
            throw new DomainError("CNPJ already exists");
        }
        const company = await this.repository.create({
            name,
            cnpj,
            cep,
            city,
            state,
            address,
            phone,
            email,
        });
        if (!company)
            throw new Error("Company not created");
        return company;
    }
}
//# sourceMappingURL=CreateCompanyUseCase.js.map