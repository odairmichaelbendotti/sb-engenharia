import type { IHashGenerator } from "../../domain/cryptography/HashGenerator.js";
import { User } from "../../domain/entities/User.js";
import { DomainError } from "../../domain/errors/DomainError.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";

export class CreateUserUseCase {
  constructor(
    private repository: IUserRepository,
    private hashGenerator: IHashGenerator,
  ) {}

  async execute(name: string, email: string, password: string) {
    const userExists = await this.repository.findByEmail(email);

    if (userExists) {
      throw new DomainError("User already exists");
    }

    console.log("ETAPA 1");

    const hashedPassword = await this.hashGenerator.generate(password);
    console.log("ETAPA 2");
    const user = new User({ name, email, password: hashedPassword });
    return await this.repository.create(user);
  }
}
