import type { Request, Response } from "express";
import type { NotaFiscalUseCase } from "../../application/usecases/NotaFiscalUseCase";
import { formatDate } from "../../utils/formatDateToInsertDb";
import { DomainError } from "../../domain/errors/DomainError";

export class NotaFiscalController {
  constructor(private createNotaFiscal: NotaFiscalUseCase) {}
  async create(req: Request, res: Response) {
    const { numero, description, vencimento, value, empenho_id, company_id } =
      req.body;

    try {
      await this.createNotaFiscal.execute({
        numero,
        description,
        vencimento,
        value,
        empenho_id,
        company_id,
      });

      res.status(201).json({ message: "Nota fiscal successfully created" });
    } catch (error) {
      if (error instanceof DomainError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
