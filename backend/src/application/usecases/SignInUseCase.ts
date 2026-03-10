import type { IHashComparer } from "../../domain/cryptography/HashComparer.js";
import type { User } from "../../domain/entities/User.js";
import { DomainError } from "../../domain/errors/DomainError.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";

export class SignInUseCase {
  constructor(
    private repository: IUserRepository,
    private hashComparer: IHashComparer,
  ) {}

  async execute({ email, password }: { email: string; password: string }) {
    const userExists: User | null = await this.repository.findByEmail(email);

    if (!userExists) throw new DomainError("Invalid credentials");

    const isHashValid = await this.hashComparer.compare({
      password,
      hash: userExists.password,
    });

    if (!isHashValid) throw new DomainError("Invalid credentials");

    return userExists;
  }
}
