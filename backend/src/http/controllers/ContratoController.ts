import type { Request, Response } from "express";
import type { CreateContratoUseCase } from "../../application/usecases/contrato/CreateContratoUseCase.js";
import type { ListContratosUseCase } from "../../application/usecases/contrato/ListContratosUseCase.js";
import type { ListContratoOptionsForObraUseCase } from "../../application/usecases/contrato/ListContratoOptionsForObraUseCase.js";
import type { UpdateContratoUseCase } from "../../application/usecases/contrato/UpdateContratoUseCase.js";
import type { UpdateContratoStatusUseCase } from "../../application/usecases/contrato/UpdateContratoStatusUseCase.js";
import type { DeleteContratoUseCase } from "../../application/usecases/contrato/DeleteContratoUseCase.js";
import { DomainError } from "../../domain/errors/DomainError.js";

const VALID_STATUSES = ["ATIVO", "FINALIZADO", "CANCELADO"];

export class ContratoController {
  constructor(
    private createContrato: CreateContratoUseCase,
    private listContratos: ListContratosUseCase,
    private listContratoOptionsForObra: ListContratoOptionsForObraUseCase,
    private updateContrato: UpdateContratoUseCase,
    private updateContratoStatus: UpdateContratoStatusUseCase,
    private deleteContrato: DeleteContratoUseCase,
  ) {}

  async create(req: Request, res: Response) {
    try {
      const { user } = req;
      if (!user) throw new DomainError("User not found");

      const { identificador, descricaoCurta, valor, dataInicio, dataFim, company_id } = req.body;

      const contrato = await this.createContrato.execute({
        user,
        identificador,
        descricaoCurta,
        valor: Number(valor),
        dataInicio,
        dataFim,
        company_id,
      });

      res.status(201).json(contrato);
    } catch (error) {
      if (error instanceof DomainError) return res.status(400).json({ message: error.message });
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const { user } = req;
      if (!user) throw new DomainError("User not found");

      const data = await this.listContratos.execute(user);
      res.status(200).json(data);
    } catch (error) {
      if (error instanceof DomainError) return res.status(400).json({ message: error.message });
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async listOptionsForObra(req: Request, res: Response) {
    try {
      const { user } = req;
      if (!user) throw new DomainError("User not found");

      const data = await this.listContratoOptionsForObra.execute(user);
      res.status(200).json(data);
    } catch (error) {
      if (error instanceof DomainError) return res.status(400).json({ message: error.message });
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { user } = req;
      if (!id || Array.isArray(id)) throw new DomainError("Invalid ID");
      if (!user) throw new DomainError("User not found");

      const { identificador, descricaoCurta, valor, dataInicio, dataFim, company_id } = req.body;

      const contrato = await this.updateContrato.execute({
        contratoId: id,
        user,
        data: {
          identificador,
          descricaoCurta,
          valor: Number(valor),
          dataInicio,
          dataFim,
          company_id,
        },
      });

      res.status(200).json(contrato);
    } catch (error) {
      if (error instanceof DomainError) return res.status(400).json({ message: error.message });
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const { user } = req;
      if (!id || Array.isArray(id)) throw new DomainError("Invalid ID");
      if (!user) throw new DomainError("User not found");
      if (!VALID_STATUSES.includes(status)) throw new DomainError("Invalid status");

      const contrato = await this.updateContratoStatus.execute({ contratoId: id, status, user });
      res.status(200).json(contrato);
    } catch (error) {
      if (error instanceof DomainError) return res.status(400).json({ message: error.message });
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { user } = req;
      if (!id || Array.isArray(id)) throw new DomainError("Invalid ID");
      if (!user) throw new DomainError("User not found");

      await this.deleteContrato.execute({ contratoId: id, user });
      res.status(200).json({ message: "Contrato successfully deleted" });
    } catch (error) {
      if (error instanceof DomainError) return res.status(400).json({ message: error.message });
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
