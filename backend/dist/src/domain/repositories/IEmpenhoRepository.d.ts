import type { Empenho } from "../../generated/prisma/client.js";
import type { EmpenhoType } from "../entities/Empenho.js";
export type UpdateStatusDTO = "ATIVO" | "FINALIZADO" | "CANCELADO";
export type empenhosDTO = {
    empenhos: (Empenho & {
        company: {
            id: string;
            name: string;
            cnpj: string;
        };
    })[];
    totalEmpenhos: number;
    totalEmpenhosAmount: number;
    activeEmpenhos: number;
    activeEmpenhosAmount: number;
    completedEmpenhos: number;
    completedEmpenhosAmount: number;
};
export interface IEmpenhoRepository {
    create(empenho: EmpenhoType): Promise<Empenho>;
    findByEmpenhoId(empenhoId: string): Promise<Empenho | null>;
    list(): Promise<empenhosDTO>;
    delete(id: string): Promise<void>;
    update(empenhoId: string, empenho: EmpenhoType): Promise<Empenho>;
    updateStatus(empenhoId: string, status: "ATIVO" | "FINALIZADO" | "CANCELADO"): Promise<Empenho>;
    incrementInvoiceValue(empenhoId: string, value: number): Promise<void>;
}
//# sourceMappingURL=IEmpenhoRepository.d.ts.map