import type { NotaFiscalType } from "../../../domain/entities/NotaFiscal";
import type { INotaFiscalRepository } from "../../../domain/repositories/INotaFiscalRepository";
import type { NotaFiscal } from "../../../generated/prisma/client";
import { prisma } from "../../prisma/prisma";

export class PrismaNotaFiscalRepository implements INotaFiscalRepository {
  async create(notaFiscal: NotaFiscalType): Promise<NotaFiscal> {
    const notaFiscalCreated = await prisma.notaFiscal.create({
      data: {
        numero: notaFiscal.numero,
        description: notaFiscal.description,
        vencimento: notaFiscal.vencimento,
        value: notaFiscal.value,
        empenho_id: notaFiscal.empenho_id,
        company_id: notaFiscal.company_id,
      },
    });

    return notaFiscalCreated;
  }
  async findByNumber(number: string): Promise<NotaFiscal | null> {
    const notaFiscal = await prisma.notaFiscal.findFirst({
      where: {
        numero: number,
      },
    });
    console.log(notaFiscal);
    return notaFiscal;
  }
}
