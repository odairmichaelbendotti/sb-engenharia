import type { NotaFiscalType } from "../../../domain/entities/NotaFiscal";
import type { INotaFiscalRepository } from "../../../domain/repositories/INotaFiscalRepository";

export class UpdateInvoiceUseCase {
  constructor(private repository: INotaFiscalRepository) {}

  async execute(notaFiscal: NotaFiscalType, id: string) {
    return this.repository.update(notaFiscal, id);
  }
}
