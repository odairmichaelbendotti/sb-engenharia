import { User } from "../../domain/entities/User.js";
import { DomainError } from "../../domain/errors/DomainError.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";

export class CreateUserUseCase {
  constructor(private repository: IUserRepository) {}

  async execute(name: string, email: string, password: string) {
    const userExists = await this.repository.findByEmail(email);

    if (userExists) {
      throw new DomainError("User already exists");
    }

    const user = new User({ name, email, password });
    return await this.repository.create(user);
  }
}
