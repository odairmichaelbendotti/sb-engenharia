import { User } from "../../../domain/entities/User.js";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
export declare class PrismaUserRepository implements IUserRepository {
    findByEmail(email: string): Promise<User | null>;
    create(user: User): Promise<User>;
}
//# sourceMappingURL=PrismaUserRepository.d.ts.map