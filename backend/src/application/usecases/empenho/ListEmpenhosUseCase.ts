import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository";

export class ListEmpenhosUseCase {
  constructor(private repository: IEmpenhoRepository) {}

  async execute() {
    return await this.repository.list();
  }
}
