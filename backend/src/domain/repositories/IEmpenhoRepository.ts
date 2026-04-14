import type { Empenho } from "../../generated/prisma/client";
import type { EmpenhoType } from "../entities/Empenho";

export interface IEmpenhoRepository {
  create(empenho: EmpenhoType): Promise<Empenho>;
  findByEmpenhoId(empenhoId: string): Promise<Empenho | null>;
}
