import type { NotaFiscalType } from "../../../domain/entities/NotaFiscal.js";
import type { INotaFiscalRepository } from "../../../domain/repositories/INotaFiscalRepository.js";

export class UpdateInvoiceUseCase {
  constructor(private repository: INotaFiscalRepository) {}

  async execute({
    notaFiscal,
    id,
  }: {
    notaFiscal: NotaFiscalType;
    id: string;
  }) {
    return this.repository.update(notaFiscal, id);
  }
}
