import type { Request, Response } from "express";
import { DomainError } from "../../domain/errors/DomainError";
import type { ListInvoicesUseCase } from "../../application/usecases/notaFiscal/ListInvoicesUseCase";
import type { DeleteInvoiceUseCase } from "../../application/usecases/notaFiscal/DeleteInvoiceUseCase";
import { CreateInvoiceUseCase } from "../../application/usecases/notaFiscal/CreateInvoiceUseCase";
import type { UpdateInvoiceUseCase } from "../../application/usecases/notaFiscal/UpdateInvoiceUseCase";

export class NotaFiscalController {
  constructor(
    private createNotaFiscal: CreateInvoiceUseCase,
    private listInvoices: ListInvoicesUseCase,
    private deleteInvoice: DeleteInvoiceUseCase,
    private updateInvoice: UpdateInvoiceUseCase,
  ) {}
  async create(req: Request, res: Response) {
    const { numero, description, vencimento, value, empenho_id, company_id } =
      req.body;

    try {
      const nf = await this.createNotaFiscal.execute({
        numero,
        description,
        vencimento,
        value,
        empenho_id,
        company_id,
      });

      console.log(nf);

      res.status(201).json(nf);
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
  async update(req: Request, res: Response) {
    if (!req.params.id || Array.isArray(req.params.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    try {
      const updated = await this.updateInvoice.execute(req.body, req.params.id);
      res.status(200).json(updated);
    } catch (error) {
      if (error instanceof DomainError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
