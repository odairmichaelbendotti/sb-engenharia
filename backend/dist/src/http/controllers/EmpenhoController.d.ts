import type { Request, Response } from "express";
import type { CreateEmpenhoUseCase } from "../../application/usecases/empenho/CreateEmpenhoUseCase.js";
import type { ListEmpenhosUseCase } from "../../application/usecases/empenho/ListEmpenhosUseCase.js";
import type { DeleteEmpenhoUseCase } from "../../application/usecases/empenho/DeleteEmpenhoUseCase.js";
import type { UpdateEmpenhoUseCase } from "../../application/usecases/empenho/UpdateEmpenhoUseCase.js";
import type { UpdateStatusEmpenhoUseCase } from "../../application/usecases/empenho/UpdateEmpenhoStatusUseCase.js";
export declare class EmpenhoController {
    private createEmpenho;
    private listEmpenhos;
    private deleteEmpenho;
    private updateEmpenho;
    private updateStatusEmpenho;
    constructor(createEmpenho: CreateEmpenhoUseCase, listEmpenhos: ListEmpenhosUseCase, deleteEmpenho: DeleteEmpenhoUseCase, updateEmpenho: UpdateEmpenhoUseCase, updateStatusEmpenho: UpdateStatusEmpenhoUseCase);
    create(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    list(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    delete(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    update(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateStatus(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=EmpenhoController.d.ts.map