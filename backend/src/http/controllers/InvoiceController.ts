import type { Request, Response } from "express";
import { DomainError } from "../../domain/errors/DomainError.js";
import type { ListInvoicesUseCase } from "../../application/usecases/invoice/ListInvoicesUseCase.js";
import type { DeleteInvoiceUseCase } from "../../application/usecases/invoice/DeleteInvoiceUseCase.js";
import { CreateInvoiceUseCase } from "../../application/usecases/invoice/CreateInvoiceUseCase.js";
import type { UpdateInvoiceUseCase } from "../../application/usecases/invoice/UpdateInvoiceUseCase.js";
import type { ListInvoiceCompanyOptionsUseCase } from "../../application/usecases/invoice/ListInvoiceCompanyOptionsUseCase.js";

export class InvoiceController {
  constructor(
    private createInvoice: CreateInvoiceUseCase,
    private listInvoices: ListInvoicesUseCase,
    private deleteInvoice: DeleteInvoiceUseCase,
    private updateInvoice: UpdateInvoiceUseCase,
    private listCompanyOptions: ListInvoiceCompanyOptionsUseCase,
  ) {}
  async create(req: Request, res: Response) {
    const { numero, description, vencimento, value, empenho_id, company_id, obra_id, ordemServico_id } =
      req.body;

    try {
      const { user } = req;

      if (!user) {
        throw new DomainError("User not found");
      }

      const invoice = await this.createInvoice.execute(
        {
          numero,
          description,
          vencimento,
          value,
          empenho_id,
          company_id,
          obra_id: obra_id || undefined,
          ordemServico_id: ordemServico_id || undefined,
        },
        user,
      );

      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof DomainError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
  async list(req: Request, res: Response) {
    try {
      const { user } = req;

      if (!user) {
        throw new DomainError("User not found");
      }

      const data = await this.listInvoices.execute(user);
      res.status(200).json(data);
    } catch (error) {
      if (error instanceof DomainError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
  async companyOptions(req: Request, res: Response) {
    try {
      const { user } = req;

      if (!user) {
        throw new DomainError("User not found");
      }

      const companies = await this.listCompanyOptions.execute(user);
      res.status(200).json(companies);
    } catch (error) {
      if (error instanceof DomainError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
  async delete(req: Request, res: Response) {
    const { id } = req.params;

    if (Array.isArray(id) || !id) {
      return res.status(400).json({ message: "Invalid id" });
    }

    try {
      const { user } = req;
      if (!user) throw new DomainError("User not found");

      await this.deleteInvoice.execute({ id, user });
      res.status(200).json({ message: "Invoice successfully deleted" });
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
      const { user } = req;

      if (!user) {
        throw new DomainError("User not found");
      }

      const updated = await this.updateInvoice.execute({
        invoice: req.body,
        id: req.params.id,
        user,
      });
      res.status(200).json(updated);
    } catch (error) {
      if (error instanceof DomainError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
