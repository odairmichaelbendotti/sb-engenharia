import type { IHashGenerator } from "../../../domain/cryptography/HashGenerator.js";
import type { ITokenGenerator } from "../../../domain/cryptography/TokenGenerator.js";
import { User } from "../../../domain/entities/User.js";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
export declare class SignUpUseCase {
    private repository;
    private hashGenerator;
    private tokenGenerator;
    constructor(repository: IUserRepository, hashGenerator: IHashGenerator, tokenGenerator: ITokenGenerator);
    execute(name: string, email: string, password: string): Promise<{
        createdUser: User;
        token: string;
    }>;
}
//# sourceMappingURL=SingnUpUseCase.d.ts.map