import { DomainError } from "../../../domain/errors/DomainError.js";
import { DomainAccessPolicy } from "../../../domain/polices/DomainAccessPolicy.js";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";

export class ListUnapprovedUsersUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new DomainError("User not found");
    }

    const unapprovedUsers = await this.userRepository.findUnapproved();

    if (!new DomainAccessPolicy().canDo(user.role, "manageUsers")) {
      throw new DomainError("UNAUTHORIZED");
    }

    if (user.role === "PLATFORM_ADMIN") {
      return unapprovedUsers;
    }

    // MASTER e COORDENACAO só enxergam cadastros da própria organização
    return unapprovedUsers.filter(
      (usuario) => usuario.tenant_id === user.tenant_id,
    );
  }
}
