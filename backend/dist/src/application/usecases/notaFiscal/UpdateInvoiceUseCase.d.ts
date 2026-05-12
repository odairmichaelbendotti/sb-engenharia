import type { NotaFiscalType } from "../../../domain/entities/NotaFiscal.js";
import type { INotaFiscalRepository } from "../../../domain/repositories/INotaFiscalRepository.js";
export declare class UpdateInvoiceUseCase {
    private repository;
    constructor(repository: INotaFiscalRepository);
    execute(notaFiscal: NotaFiscalType, id: string): Promise<NotaFiscalType>;
}
//# sourceMappingURL=UpdateInvoiceUseCase.d.ts.map