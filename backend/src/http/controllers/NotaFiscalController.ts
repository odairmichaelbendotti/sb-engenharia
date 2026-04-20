import type { Request, Response } from "express";
import type { NotaFiscalUseCase } from "../../application/usecases/notaFiscal/CreateInvoiceUseCase";
import { DomainError } from "../../domain/errors/DomainError";
import type { ListInvoicesUseCase } from "../../application/usecases/notaFiscal/ListInvoicesUseCase";
import type { DeleteInvoiceUseCase } from "../../application/usecases/notaFiscal/DeleteInvoiceUseCase";

export class NotaFiscalController {
  constructor(
    private createNotaFiscal: NotaFiscalUseCase,
    private listInvoices: ListInvoicesUseCase,
    private deleteInvoice: DeleteInvoiceUseCase,
  ) {}
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
  async list(req: Request, res: Response) {
    const data = await this.listInvoices.execute();
    res.status(200).json(data);
  }
  async delete(req: Request, res: Response) {
    const { id } = req.params;

    if (Array.isArray(id) || !id) {
      return res.status(400).json({ message: "Invalid id" });
    }

    try {
      await this.deleteInvoice.execute(id);
      res.status(200).json({ message: "Nota fiscal successfully deleted" });
    } catch (error) {
      if (error instanceof DomainError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
