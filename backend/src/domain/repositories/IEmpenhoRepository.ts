import type { Empenho } from "../../generated/prisma/client";
import type { EmpenhoType } from "../entities/Empenho";

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
}
