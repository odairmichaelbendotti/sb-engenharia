import type { NotaFiscal } from "../../generated/prisma/client";
import type { NotaFiscalType } from "../entities/NotaFiscal";

export type listInvoices = {
  totalCount: number;
  totalValue: number;
  paidInvoices: number;
  paidValue: number;
  expiredCount: number;
  expiredValue: number;
  pendingInvoices: number;
  pendingValue: number;
  allInvoices: NotaFiscal[];
};

export interface INotaFiscalRepository {
  create(notaFiscal: NotaFiscalType): Promise<NotaFiscal>;
  findByNumber(number: string): Promise<NotaFiscal | null>;
  list(): Promise<listInvoices>;
}
