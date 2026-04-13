import type { IHashComparer } from "../../../domain/cryptography/HashComparer.js";
import type { ITokenGenerator } from "../../../domain/cryptography/TokenGenerator.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";

export class SignInUseCase {
  constructor(
    private repository: IUserRepository,
    private hashComparer: IHashComparer,
    private tokenGenerate: ITokenGenerator,
  ) {}

  async execute({ email, password }: { email: string; password: string }) {
    const user = await this.repository.findByEmail(email);

    if (!user) throw new DomainError("Invalid credentials");

    const isHashValid = await this.hashComparer.compare({
      password,
      hash: user.password,
    });

    if (!isHashValid) throw new DomainError("Invalid credentials");

    const token = this.tokenGenerate.generate({
      name: user.name,
      email: user.email,
    });

    return { user, token };
  }
}
