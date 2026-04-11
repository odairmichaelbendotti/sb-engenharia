import type { Request, Response } from "express";
import type { EmpenhoUseCase } from "../../application/usecases/EmpenhoUseCase";
import { prisma } from "../../infrastructure/prisma/prisma";
import { formatDate } from "../../utils/formatDateToInsertDb";
import { DomainError } from "../../domain/errors/DomainError";

export class EmpenhoController {
  constructor(private createEmpenho: EmpenhoUseCase) {}

  async create(req: Request, res: Response) {
    try {
      const { numero, description, startAt, endAt, value, company_id } =
        req.body;

      await this.createEmpenho.execute({
        numero,
        description,
        startAt,
        endAt,
        value,
        company_id,
      });

      res.status(201).json({ message: "Empenho created successfully" });
    } catch (error) {
      if (error instanceof DomainError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
