import { DomainError } from "../../../domain/errors/DomainError.js";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import type { User } from "../../../generated/prisma/client.js";

export class DisapproveUserUseCase {
  constructor(private userRepository: IUserRepository) {}
  async execute({ userId, user }: { userId: string; user: User }) {
    const allowUser = ["MASTER", "PLATFORM_ADMIN"];

    if (!allowUser.includes(user.role)) {
      throw new DomainError("User does not have permission");
    }

    const userExists = await this.userRepository.findById(userId);

    if (!userExists) {
      throw new DomainError("User not found");
    }

    await this.userRepository.disapprove(userId);
  }
}
