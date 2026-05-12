import { User } from "../entities/User.js";
export interface IUserRepository {
    create(user: User): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
}
//# sourceMappingURL=IUserRepository.d.ts.map