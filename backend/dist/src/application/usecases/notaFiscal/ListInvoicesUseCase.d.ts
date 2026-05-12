import type { INotaFiscalRepository } from "../../../domain/repositories/INotaFiscalRepository.js";
export declare class ListInvoicesUseCase {
    private repository;
    constructor(repository: INotaFiscalRepository);
    execute(): Promise<import("../../../domain/repositories/INotaFiscalRepository.js").listInvoices>;
}
//# sourceMappingURL=ListInvoicesUseCase.d.ts.map