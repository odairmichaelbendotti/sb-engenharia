import { User } from "../../../domain/entities/User.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type {
  IUserRepository,
  ListUserType,
} from "../../../domain/repositories/IUserRepository.js";
import type { UserRole } from "../../../generated/prisma/enums.js";
import { prisma } from "../../prisma/prisma.js";

export class PrismaUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
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
        approved: user.approved,
        tenant_id: user.tenant_id,
        email: user.email,
        password: user.password,
        role: user.role,
      });
    } catch (err) {
      throw new DomainError("Server error");
    }
  }
  async findById(id: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        return null;
      }

      return new User({
        id: user.id,
        name: user.name,
        approved: user.approved,
        tenant_id: user.tenant_id,
        email: user.email,
        password: user.password,
        role: user.role,
      });
    } catch (err) {
      throw new DomainError("Server error");
    }
  }
  async create(user: User): Promise<User> {
    try {
      const newUser = await prisma.user.create({
        data: {
          name: user.name,
          tenant_id: user.tenant_id,
          email: user.email,
          password: user.password,
          approved: user.approved,
        },
      });

      return new User({
        id: newUser.id,
        name: newUser.name,
        approved: newUser.approved,
        tenant_id: newUser.tenant_id,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
      });
    } catch (err) {
      throw new DomainError("Server error");
    }
  }
  async findUnapproved(): Promise<User[]> {
    return await prisma.user.findMany({
      where: {
        approved: false,
      },
      include: { tenant: { select: { name: true } } },
    });
  }
  async approve(userId: string): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        approved: true,
      },
    });
  }
  async disapprove(userId: string): Promise<void> {
    await prisma.user.delete({
      where: { id: userId },
    });
  }
  async list({ tenant_id, page }: ListUserType): Promise<User[]> {
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    if (tenant_id)
      return await prisma.user.findMany({
        where: { tenant_id },
        skip,
        take: pageSize,
      });
    return await prisma.user.findMany({ skip, take: pageSize });
  }
  async updateRole(userId: string, role: UserRole): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }
}
