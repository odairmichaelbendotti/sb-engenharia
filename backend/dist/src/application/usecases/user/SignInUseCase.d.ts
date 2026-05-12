import type { IHashComparer } from "../../../domain/cryptography/HashComparer.js";
import type { ITokenGenerator } from "../../../domain/cryptography/TokenGenerator.js";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
export declare class SignInUseCase {
    private repository;
    private hashComparer;
    private tokenGenerate;
    constructor(repository: IUserRepository, hashComparer: IHashComparer, tokenGenerate: ITokenGenerator);
    execute({ email, password }: {
        email: string;
        password: string;
    }): Promise<{
        user: import("../../../domain/entities/User.js").User;
        token: string;
    }>;
}
//# sourceMappingURL=SignInUseCase.d.ts.map