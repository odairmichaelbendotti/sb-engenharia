import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { EmpenhoType } from "../../../domain/entities/Empenho.js";
import type { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";
export declare class UpdateEmpenhoUseCase {
    private updateEmpenho;
    private findCompanyById;
    constructor(updateEmpenho: IEmpenhoRepository, findCompanyById: ICompanyRepository);
    execute(empenhoId: string, data: EmpenhoType, user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        numero: string;
        description: string;
        startAt: Date;
        endAt: Date;
        value: number;
        totalPaid: number;
        status: import("../../../generated/prisma/enums.js").EmpenhoStatus;
        company_id: string;
    }>;
}
//# sourceMappingURL=UpdateEmpenhoUseCase.d.ts.map