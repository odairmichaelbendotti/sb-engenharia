import type { Request, Response } from "express";
import type { CreateEmpenhoUseCase } from "../../application/usecases/empenho/CreateEmpenhoUseCase";
import { DomainError } from "../../domain/errors/DomainError";
import type { ListEmpenhosUseCase } from "../../application/usecases/empenho/ListEmpenhosUseCase";
import type { DeleteEmpenhoUseCase } from "../../application/usecases/empenho/DeleteEmpenhoUseCase";
import type { UpdateEmpenhoUseCase } from "../../application/usecases/empenho/UpdateEmpenhoUseCase";
import type { UpdateStatusEmpenhoUseCase } from "../../application/usecases/empenho/UpdateEmpenhoStatusUseCase";

export class EmpenhoController {
  constructor(
    private createEmpenho: CreateEmpenhoUseCase,
    private listEmpenhos: ListEmpenhosUseCase,
    private deleteEmpenho: DeleteEmpenhoUseCase,
    private updateEmpenho: UpdateEmpenhoUseCase,
    private updateStatusEmpenho: UpdateStatusEmpenhoUseCase,
  ) {}

  async create(req: Request, res: Response) {
    try {
      const { numero, description, startAt, endAt, value, company_id } =
        req.body;
      const { user } = req;

      if (!user) {
        throw new DomainError("User not found");
      }

      const empenho = await this.createEmpenho.execute(user, {
        numero,
        description,
        startAt,
        endAt,
        value,
        company_id,
      });

      res.status(201).json(empenho);
    } catch (error) {
      if (error instanceof DomainError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
  async list(req: Request, res: Response) {
    try {
      const empenhos = await this.listEmpenhos.execute();
      res.status(200).json(empenhos);
    } catch (error) {
      if (error instanceof DomainError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
  async delete(req: Request, res: Response) {
    try {
      const { empenhoId } = req.params;
      const { user } = req;

      if (!user) {
        throw new DomainError("User not found");
      }

      if (!empenhoId || Array.isArray(empenhoId)) {
        throw new DomainError("Empenho ID is required");
      }

      await this.deleteEmpenho.execute({
        user,
        empenhoId,
      });

      res.status(204).send();
    } catch (error) {
      if (error instanceof DomainError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
  async update(req: Request, res: Response) {
    const { empenhoId } = req.params;
    const { numero, description, startAt, endAt, value, company_id } = req.body;
    const { user } = req;

    if (Array.isArray(empenhoId) || !empenhoId) {
      throw new DomainError("Empenho ID is required");
    }

    if (!user) {
      throw new DomainError("User not found");
    }

    if (
      !numero ||
      !description ||
      !startAt ||
      !endAt ||
      !value ||
      !company_id
    ) {
      throw new DomainError("All fields are required");
    }

    const editedEmpenho = await this.updateEmpenho.execute(
      empenhoId,
      req.body,
      user,
    );

    res.status(200).json(editedEmpenho);

    try {
    } catch (error) {
      if (error instanceof DomainError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
  async updateStatus(req: Request, res: Response) {
    const { empenhoId } = req.params;
    const { status } = req.body;
    const { user } = req;
    console.log(empenhoId);

    if (!user) {
      throw new DomainError("User not found");
    }

    if (!empenhoId || Array.isArray(empenhoId)) {
      throw new DomainError("Empenho ID is required");
    }

    if (!status) {
      throw new DomainError("Status is required");
    }

    const updatedEmpenho = await this.updateStatusEmpenho.execute(
      empenhoId,
      status,
      user,
    );

    res.status(200).json(updatedEmpenho);
  }
}
