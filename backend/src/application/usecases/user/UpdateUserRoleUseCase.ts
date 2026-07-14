import { DomainError } from "../../../domain/errors/DomainError.js";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { UserRole } from "../../../generated/prisma/enums.js";
import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";

export class UpdateUserRoleUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute({
    userId,
    role,
    user,
  }: {
    userId: string;
    role: UserRole;
    user: AuthenticatedUser;
  }) {
    if (userId === user.id) {
      throw new DomainError("You cannot change your own role");
    }

    const targetUser = await this.userRepository.findById(userId);

    if (!targetUser) {
      throw new DomainError("User not found");
    }

    if (!targetUser.approved) {
      throw new DomainError("User is not approved yet");
    }

    if (user.role === "PLATFORM_ADMIN") {
      return await this.userRepository.updateRole(userId, role);
    }

    if (user.role === "MASTER") {
      if (targetUser.tenant_id !== user.tenant_id) {
        throw new DomainError("User does not belong to your organization");
      }
      if (role === "PLATFORM_ADMIN") {
        throw new DomainError("You cannot grant this role");
      }
      return await this.userRepository.updateRole(userId, role);
    }

    throw new DomainError("User does not have permission");
  }
}
