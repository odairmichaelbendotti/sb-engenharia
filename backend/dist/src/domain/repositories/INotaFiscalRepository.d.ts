import type { NotaFiscal } from "../../generated/prisma/client.js";
import type { NotaFiscalType } from "../entities/NotaFiscal.js";
export type listInvoices = {
    totalCount: number;
    totalValue: number;
    paidInvoices: number;
    paidValue: number;
    expiredCount: number;
    expiredValue: number;
    pendingInvoices: number;
    pendingValue: number;
    allInvoices: NotaFiscal[];
};
export interface INotaFiscalRepository {
    create(notaFiscal: NotaFiscalType): Promise<NotaFiscal>;
    findByNumber(number: string): Promise<NotaFiscal | null>;
    list(): Promise<listInvoices>;
    delete(id: string): Promise<void>;
    update(notaFiscal: NotaFiscalType, id: string): Promise<NotaFiscalType>;
}
//# sourceMappingURL=INotaFiscalRepository.d.ts.map