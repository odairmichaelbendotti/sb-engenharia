import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";
export declare class ListEmpenhosUseCase {
    private repository;
    constructor(repository: IEmpenhoRepository);
    execute(): Promise<import("../../../domain/repositories/IEmpenhoRepository.js").empenhosDTO>;
}
//# sourceMappingURL=ListEmpenhosUseCase.d.ts.map