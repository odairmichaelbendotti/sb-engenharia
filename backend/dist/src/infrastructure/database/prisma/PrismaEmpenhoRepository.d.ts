import type { empenhosDTO, IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";
import type { EmpenhoType } from "../../../domain/entities/Empenho.js";
import type { Empenho } from "../../../generated/prisma/client.js";
export declare class PrismaEmpenhoRepository implements IEmpenhoRepository {
    create(empenho: EmpenhoType): Promise<Empenho>;
    findByEmpenhoId(empenhoId: string): Promise<Empenho | null>;
    list(): Promise<empenhosDTO>;
    delete(empenhoId: string): Promise<void>;
    update(empenhoId: string, empenho: EmpenhoType): Promise<Empenho>;
    updateStatus(empenhoId: string, status: "ATIVO" | "FINALIZADO" | "CANCELADO"): Promise<Empenho>;
    incrementInvoiceValue(empenhoId: string, value: number): Promise<void>;
}
//# sourceMappingURL=PrismaEmpenhoRepository.d.ts.map