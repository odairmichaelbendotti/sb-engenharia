import { DomainError } from "../../../domain/errors/DomainError.js";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";

export class ListUnapprovedUsersUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new DomainError("User not found");
    }

    const unapprovedUsers = await this.userRepository.findUnapproved();

    if (user.role === "MASTER") {
      return unapprovedUsers.filter(
        (usuario) => usuario.tenant_id === user.tenant_id,
      );
    }

    if (user.role === "PLATFORM_ADMIN") {
      return unapprovedUsers;
    }

    throw new DomainError("UNAUTHORIZED");
  }
}
