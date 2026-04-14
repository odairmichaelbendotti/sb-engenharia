import { Router } from "express";
import { PrismaNotaFiscalRepository } from "../../infrastructure/database/prisma/PrismaNotaFiscalRepository";
import { NotaFiscalUseCase } from "../../application/usecases/notaFiscal/NotaFiscalUseCase";
import { NotaFiscalController } from "../controllers/NotaFiscalController";

export const NotaFiscalRoutes = Router();

const repository = new PrismaNotaFiscalRepository();
const notaFiscalUseCase = new NotaFiscalUseCase(repository);
const notaFiscalController = new NotaFiscalController(notaFiscalUseCase);

NotaFiscalRoutes.post("/nota-fiscal/create", (req, res) =>
  notaFiscalController.create(req, res),
);
