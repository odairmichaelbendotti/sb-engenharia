import type { NotaFiscalType } from "../../../domain/entities/NotaFiscal.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";
import type { INotaFiscalRepository } from "../../../domain/repositories/INotaFiscalRepository.js";
export declare class CreateInvoiceUseCase {
    private repository;
    private empenhoRepository;
    constructor(repository: INotaFiscalRepository, empenhoRepository: IEmpenhoRepository);
    execute({ numero, description, vencimento, value, empenho_id, company_id, }: NotaFiscalType): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        numero: string;
        description: string;
        value: number;
        status: import("../../../generated/prisma/enums.js").NotaFiscalStatus;
        company_id: string;
        vencimento: Date;
        empenho_id: string;
    }>;
}
//# sourceMappingURL=CreateInvoiceUseCase.d.ts.map