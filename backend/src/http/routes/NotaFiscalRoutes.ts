import { Router } from "express";
import { PrismaNotaFiscalRepository } from "../../infrastructure/database/prisma/PrismaNotaFiscalRepository";
import { NotaFiscalUseCase } from "../../application/usecases/notaFiscal/CreateInvoiceUseCase";
import { NotaFiscalController } from "../controllers/NotaFiscalController";
import { ListInvoicesUseCase } from "../../application/usecases/notaFiscal/ListInvoicesUseCase";

export const NotaFiscalRoutes = Router();

const repository = new PrismaNotaFiscalRepository();
const notaFiscalUseCase = new NotaFiscalUseCase(repository);
const listInvoicesUseCase = new ListInvoicesUseCase(repository);
const notaFiscalController = new NotaFiscalController(
  notaFiscalUseCase,
  listInvoicesUseCase,
);

NotaFiscalRoutes.post("/nota-fiscal/create", (req, res) =>
  notaFiscalController.create(req, res),
);

NotaFiscalRoutes.get("/nota-fiscal/list", (req, res) =>
  notaFiscalController.list(req, res),
);
