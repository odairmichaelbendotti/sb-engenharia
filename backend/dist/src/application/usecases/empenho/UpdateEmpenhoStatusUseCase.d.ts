import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { IEmpenhoRepository, UpdateStatusDTO } from "../../../domain/repositories/IEmpenhoRepository.js";
export declare class UpdateStatusEmpenhoUseCase {
    private repository;
    constructor(repository: IEmpenhoRepository);
    execute(empenhoId: string, status: UpdateStatusDTO, user: AuthenticatedUser): Promise<{
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
//# sourceMappingURL=UpdateEmpenhoStatusUseCase.d.ts.map