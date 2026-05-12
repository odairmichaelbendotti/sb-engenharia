import type { AuthenticatedUser } from "../../../@types/AuthenticatedUser.js";
import type { EmpenhoType } from "../../../domain/entities/Empenho.js";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository.js";
export declare class CreateEmpenhoUseCase {
    private repository;
    constructor(repository: IEmpenhoRepository);
    execute(user: AuthenticatedUser, { numero, description, startAt, endAt, value, company_id }: EmpenhoType): Promise<{
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
//# sourceMappingURL=CreateEmpenhoUseCase.d.ts.map