import type { IHashComparer } from "../../../domain/cryptography/HashComparer.js";
import type { ITokenGenerator } from "../../../domain/cryptography/TokenGenerator.js";
import { DomainError } from "../../../domain/errors/DomainError.js";
import { normalizeInput, USER_RULES } from "../../../domain/normalization/input-rules.js";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";

export class SignInUseCase {
  constructor(
    private repository: IUserRepository,
    private hashComparer: IHashComparer,
    private tokenGenerate: ITokenGenerator,
  ) {}

  async execute({ email, password }: { email: string; password: string }) {
    // Mesmo formato gravado no cadastro (minúsculas, sem espaços)
    ({ email } = normalizeInput({ email }, USER_RULES));
    const user = await this.repository.findByEmail(email);

    if (!user) throw new DomainError("Invalid credentials");

    const isHashValid = await this.hashComparer.compare({
      password,
      hash: user.password,
    });

    if (!isHashValid) throw new DomainError("Invalid credentials");

    const token = this.tokenGenerate.generate({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }
}
