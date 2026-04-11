import type { NotaFiscal } from "../../generated/prisma/client";
import type { NotaFiscalType } from "../entities/NotaFiscal";

export interface INotaFiscalRepository {
  create(notaFiscal: NotaFiscalType): Promise<NotaFiscal>;
  findByNumber(number: string): Promise<NotaFiscal | null>;
}
