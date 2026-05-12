import type { NotaFiscalType } from "../../../domain/entities/NotaFiscal.js";
import type { INotaFiscalRepository, listInvoices } from "../../../domain/repositories/INotaFiscalRepository.js";
import type { NotaFiscal } from "../../../generated/prisma/client.js";
export declare class PrismaNotaFiscalRepository implements INotaFiscalRepository {
    create(notaFiscal: NotaFiscalType): Promise<NotaFiscal>;
    findByNumber(number: string): Promise<NotaFiscal | null>;
    list(): Promise<listInvoices>;
    delete(id: string): Promise<void>;
    update(notaFiscal: NotaFiscalType, id: string): Promise<NotaFiscalType>;
}
//# sourceMappingURL=PrismaNotaFiscalRepository.d.ts.map