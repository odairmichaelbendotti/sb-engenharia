import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import { AdminPolicy } from "../../../domain/polices/AdminPolicy.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";

type DeleteEmpenhoUseCaseInput = {
  user: AuthenticatedUser;
  empenhoId: string;
};

export class DeleteEmpenhoUseCase {
  constructor(private deleteEmpenho: IEmpenhoRepository) {}

  async execute({ user, empenhoId }: DeleteEmpenhoUseCaseInput): Promise<void> {
    const isAdmin = new AdminPolicy().isAdmin(user);

    if (!isAdmin) {
      throw new Error("User is not authorized to perform this action");
    }

    await this.deleteEmpenho.delete(empenhoId);
  }
}
