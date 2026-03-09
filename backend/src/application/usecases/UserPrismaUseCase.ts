import { User } from "../../domain/entities/User.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";

export class UserPrismaUseCase {
  constructor(private repository: IUserRepository) {}

  execute(
    id: string,
    name: string,
    email: string,
    password: string,
    admin: boolean,
  ) {
    const user = new User(id, name, email, password, admin);
    return this.repository.create(user);
  }
}
