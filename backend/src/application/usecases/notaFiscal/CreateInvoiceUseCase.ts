import type { NotaFiscalType } from "../../../domain/entities/NotaFiscal";
import { DomainError } from "../../../domain/errors/DomainError";
import type { IEmpenhoRepository } from "../../../domain/repositories/IEmpenhoRepository";
import type { INotaFiscalRepository } from "../../../domain/repositories/INotaFiscalRepository";

export class CreateInvoiceUseCase {
  constructor(
    private repository: INotaFiscalRepository,
    private empenhoRepository: IEmpenhoRepository,
  ) {}

  async execute({
    numero,
    description,
    vencimento,
    value,
    empenho_id,
    company_id,
  }: NotaFiscalType) {
    if (value <= 0) {
      throw new DomainError("Value must be greater than 0");
    }

    const empenho = await this.empenhoRepository.findByEmpenhoId(empenho_id);

    if (!empenho) {
      throw new DomainError("Empenho not found");
    }

    if (empenho.totalPaid + value * 100 > empenho.value) {
      throw new DomainError("Value exceeds empenho limit");
    }

    const notaFiscalExist = await this.repository.findByNumber(numero);

    if (
      notaFiscalExist &&
      notaFiscalExist.company_id === company_id &&
      notaFiscalExist.empenho_id === empenho_id
    ) {
      throw new DomainError("Nota fiscal already exists");
    }

    await this.empenhoRepository.incrementInvoiceValue(empenho_id, value);

    return await this.repository.create({
      numero,
      description,
      vencimento: new Date(vencimento),
      value: value * 100,
      empenho_id,
      company_id,
    });
  }
}
