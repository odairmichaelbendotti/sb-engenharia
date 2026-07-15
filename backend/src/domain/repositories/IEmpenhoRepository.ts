import type { EmpenhoType, PersistedEmpenho } from "../entities/Empenho.js";

export type UpdateStatusDTO = "ATIVO" | "FINALIZADO" | "CANCELADO";

export type empenhosDTO = {
  empenhos: (PersistedEmpenho & {
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
  create(empenho: EmpenhoType): Promise<PersistedEmpenho>;
  findByEmpenhoId(empenhoId: string): Promise<PersistedEmpenho | null>;
  list(tenant_id?: string): Promise<empenhosDTO>;
  delete(id: string): Promise<void>;
  update(empenhoId: string, empenho: EmpenhoType): Promise<PersistedEmpenho>;
  updateStatus(
    empenhoId: string,
    status: "ATIVO" | "FINALIZADO" | "CANCELADO",
  ): Promise<PersistedEmpenho>;
  incrementInvoiceValue(empenhoId: string, value: number): Promise<void>;
}
