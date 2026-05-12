import type { Request, Response } from "express";
import type { ListInvoicesUseCase } from "../../application/usecases/notaFiscal/ListInvoicesUseCase.js";
import type { DeleteInvoiceUseCase } from "../../application/usecases/notaFiscal/DeleteInvoiceUseCase.js";
import { CreateInvoiceUseCase } from "../../application/usecases/notaFiscal/CreateInvoiceUseCase.js";
import type { UpdateInvoiceUseCase } from "../../application/usecases/notaFiscal/UpdateInvoiceUseCase.js";
export declare class NotaFiscalController {
    private createNotaFiscal;
    private listInvoices;
    private deleteInvoice;
    private updateInvoice;
    constructor(createNotaFiscal: CreateInvoiceUseCase, listInvoices: ListInvoicesUseCase, deleteInvoice: DeleteInvoiceUseCase, updateInvoice: UpdateInvoiceUseCase);
    create(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    list(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    update(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=NotaFiscalController.d.ts.map