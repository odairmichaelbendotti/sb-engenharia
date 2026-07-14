import type {
  IUserRepository,
  ListUserType,
} from "../../../domain/repositories/IUserRepository.js";

export class ListUsersUseCase {
  constructor(private userRepository: IUserRepository) {}
  async execute({ tenant_id, page }: ListUserType) {
    return await this.userRepository.list({ tenant_id, page });
  }
}
