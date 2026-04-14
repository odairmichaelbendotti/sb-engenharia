import type { NotaFiscalType } from "../../../domain/entities/NotaFiscal";
import { DomainError } from "../../../domain/errors/DomainError";
import type { INotaFiscalRepository } from "../../../domain/repositories/INotaFiscalRepository";

export class NotaFiscalUseCase {
  constructor(private repository: INotaFiscalRepository) {}

  async execute({
    numero,
    description,
    vencimento,
    value,
    empenho_id,
    company_id,
  }: NotaFiscalType) {
    const notaFiscalExist = await this.repository.findByNumber(numero);

    if (
      notaFiscalExist &&
      notaFiscalExist.company_id === company_id &&
      notaFiscalExist.empenho_id === empenho_id
    ) {
      throw new DomainError("Nota fiscal already exists");
    }

    await this.repository.create({
      numero,
      description,
      vencimento,
      value: value * 100,
      empenho_id,
      company_id,
    });
  }
}
