import type { Request, Response } from "express";
import type { CreateOrdemServicoUseCase } from "../../application/usecases/ordem-servico/CreateOrdemServicoUseCase.js";
import type { ListOrdensServicoUseCase } from "../../application/usecases/ordem-servico/ListOrdensServicoUseCase.js";
import type { ListOrdemServicoOptionsForObraUseCase } from "../../application/usecases/ordem-servico/ListOrdemServicoOptionsForObraUseCase.js";
import type { UpdateOrdemServicoUseCase } from "../../application/usecases/ordem-servico/UpdateOrdemServicoUseCase.js";
import type { UpdateOrdemServicoStatusUseCase } from "../../application/usecases/ordem-servico/UpdateOrdemServicoStatusUseCase.js";
import type { DeleteOrdemServicoUseCase } from "../../application/usecases/ordem-servico/DeleteOrdemServicoUseCase.js";
import { DomainError } from "../../domain/errors/DomainError.js";

const VALID_STATUSES = ["ATIVO", "FINALIZADO", "CANCELADO"];

export class OrdemServicoController {
  constructor(
    private createOrdemServico: CreateOrdemServicoUseCase,
    private listOrdensServico: ListOrdensServicoUseCase,
    private listOrdemServicoOptionsForObra: ListOrdemServicoOptionsForObraUseCase,
    private updateOrdemServico: UpdateOrdemServicoUseCase,
    private updateOrdemServicoStatus: UpdateOrdemServicoStatusUseCase,
    private deleteOrdemServico: DeleteOrdemServicoUseCase,
  ) {}

  async create(req: Request, res: Response) {
    try {
      const { user } = req;
      if (!user) throw new DomainError("User not found");

      const { numero, valor, empenho_id } = req.body;

      const ordemServico = await this.createOrdemServico.execute({
        user,
        numero,
        valor: Number(valor),
        empenho_id,
      });

      res.status(201).json(ordemServico);
    } catch (error) {
      if (error instanceof DomainError) return res.status(400).json({ message: error.message });
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const { user } = req;
      if (!user) throw new DomainError("User not found");

      const data = await this.listOrdensServico.execute(user);
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

      const data = await this.listOrdemServicoOptionsForObra.execute(user);
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

      const { numero, valor, empenho_id } = req.body;

      const ordemServico = await this.updateOrdemServico.execute({
        ordemServicoId: id,
        user,
        data: {
          numero,
          valor: Number(valor),
          empenho_id,
        },
      });

      res.status(200).json(ordemServico);
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

      const ordemServico = await this.updateOrdemServicoStatus.execute({
        ordemServicoId: id,
        status,
        user,
      });
      res.status(200).json(ordemServico);
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

      await this.deleteOrdemServico.execute({ ordemServicoId: id, user });
      res.status(200).json({ message: "Ordem de serviço successfully deleted" });
    } catch (error) {
      if (error instanceof DomainError) return res.status(400).json({ message: error.message });
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
