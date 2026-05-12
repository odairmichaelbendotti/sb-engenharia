import { DomainError } from "../../../domain/errors/DomainError.js";
export class SignInUseCase {
    repository;
    hashComparer;
    tokenGenerate;
    constructor(repository, hashComparer, tokenGenerate) {
        this.repository = repository;
        this.hashComparer = hashComparer;
        this.tokenGenerate = tokenGenerate;
    }
    async execute({ email, password }) {
        const user = await this.repository.findByEmail(email);
        if (!user)
            throw new DomainError("Invalid credentials");
        const isHashValid = await this.hashComparer.compare({
            password,
            hash: user.password,
        });
        if (!isHashValid)
            throw new DomainError("Invalid credentials");
        const token = this.tokenGenerate.generate({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
        return { user, token };
    }
}
//# sourceMappingURL=SignInUseCase.js.map