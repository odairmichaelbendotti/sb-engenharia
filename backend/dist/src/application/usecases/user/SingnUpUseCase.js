import { User } from "../../../domain/entities/User.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
export class SignUpUseCase {
    repository;
    hashGenerator;
    tokenGenerator;
    constructor(repository, hashGenerator, tokenGenerator) {
        this.repository = repository;
        this.hashGenerator = hashGenerator;
        this.tokenGenerator = tokenGenerator;
    }
    async execute(name, email, password) {
        const userExists = await this.repository.findByEmail(email);
        if (userExists) {
            throw new DomainError("User already exists");
        }
        const hashedPassword = await this.hashGenerator.generate(password);
        const user = new User({ name, email, password: hashedPassword });
        const createdUser = await this.repository.create(user);
        const token = this.tokenGenerator.generate({
            id: createdUser.id,
            name: createdUser.name,
            email: createdUser.email,
            role: createdUser.role,
        });
        console.log("User created:", createdUser);
        console.log("Token generated:", token);
        return { createdUser, token };
    }
}
//# sourceMappingURL=SingnUpUseCase.js.map