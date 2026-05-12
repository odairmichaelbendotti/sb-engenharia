import { User } from "../../../domain/entities/User.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { prisma } from "../../prisma/prisma.js";
export class PrismaUserRepository {
    async findByEmail(email) {
        try {
            const user = await prisma.user.findFirst({
                where: { email },
            });
            if (!user) {
                return null;
            }
            return new User({
                id: user.id,
                name: user.name,
                email: user.email,
                password: user.password,
                role: user.role,
            });
        }
        catch (err) {
            throw new DomainError("Server error");
        }
    }
    async create(user) {
        try {
            const newUser = await prisma.user.create({
                data: {
                    name: user.name,
                    email: user.email,
                    password: user.password,
                },
            });
            return new User({
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                password: newUser.password,
            });
        }
        catch (err) {
            throw new Error("Erro servidor");
        }
    }
}
//# sourceMappingURL=PrismaUserRepository.js.map