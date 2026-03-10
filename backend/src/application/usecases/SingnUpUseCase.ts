import type { IHashGenerator } from "../../domain/cryptography/HashGenerator.js";
import { User } from "../../domain/entities/User.js";
import { DomainError } from "../../domain/errors/DomainError.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";

export class SignUpUseCase {
  constructor(
    private repository: IUserRepository,
    private hashGenerator: IHashGenerator,
  ) {}

  async execute(name: string, email: string, password: string) {
    const userExists = await this.repository.findByEmail(email);

    if (userExists) {
      throw new DomainError("User already exists");
    }

    const hashedPassword = await this.hashGenerator.generate(password);
    const user = new User({ name, email, password: hashedPassword });
    return await this.repository.create(user);
  }
}
