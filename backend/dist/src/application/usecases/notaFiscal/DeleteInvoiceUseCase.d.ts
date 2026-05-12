import type { INotaFiscalRepository } from "../../../domain/repositories/INotaFiscalRepository.js";
export declare class DeleteInvoiceUseCase {
    private deleteInvoice;
    constructor(deleteInvoice: INotaFiscalRepository);
    execute(id: string): Promise<void>;
}
//# sourceMappingURL=DeleteInvoiceUseCase.d.ts.map