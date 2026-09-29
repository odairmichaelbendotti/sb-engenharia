import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { User } from "../../../generated/prisma/client.js";

export class ApproveUserUseCase {
  constructor(private userRepository: IUserRepository) {}
  async execute({ userId, user }: { userId: string; user: User }) {
    const userExists = await this.userRepository.findById(userId);

    if (!userExists) {
      throw new DomainError("User not found");
    }

    if (!new DomainAccessPolicy().canDo(user.role, "manageUsers")) {
      throw new DomainError("User does not have permission");
    }

    if (user.role !== "PLATFORM_ADMIN" && userExists.tenant_id !== user.tenant_id) {
      throw new DomainError("User not found");
    }
    const approvedUser = await this.userRepository.approve(userId);
    if (!approvedUser) {
      throw new DomainError("Error approving the user");
    }
    return approvedUser;
  }
}
