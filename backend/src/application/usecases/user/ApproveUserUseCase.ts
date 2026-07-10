import { DomainError } from "../../../domain/errors/DomainError.js";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { User } from "../../../generated/prisma/client.js";

export class ApproveUserUseCase {
  constructor(private userRepository: IUserRepository) {}
  async execute({ userId, user }: { userId: string; user: User }) {
    const userExists = await this.userRepository.findById(userId);

    if (!userExists) {
      throw new DomainError("User not found");
    }

    const allowedUser = ["MASTER", "PLATFORM_ADMIN"];

    if (!allowedUser.includes(user.role)) {
      throw new DomainError("User does not have permission");
    }
    const approvedUser = await this.userRepository.approve(userId);
    if (!approvedUser) {
      throw new DomainError("Error approving the user");
    }
    return approvedUser;
  }
}
