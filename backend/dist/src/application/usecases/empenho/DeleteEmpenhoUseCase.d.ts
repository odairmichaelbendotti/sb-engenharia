import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";
type DeleteEmpenhoUseCaseInput = {
    user: AuthenticatedUser;
    empenhoId: string;
};
export declare class DeleteEmpenhoUseCase {
    private deleteEmpenho;
    constructor(deleteEmpenho: IEmpenhoRepository);
    execute({ user, empenhoId }: DeleteEmpenhoUseCaseInput): Promise<void>;
}
export {};
//# sourceMappingURL=DeleteEmpenhoUseCase.d.ts.map