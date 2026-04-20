import { Router } from "express";
import { PrismaNotaFiscalRepository } from "../../infrastructure/database/prisma/PrismaNotaFiscalRepository";
import { NotaFiscalUseCase } from "../../application/usecases/notaFiscal/CreateInvoiceUseCase";
import { NotaFiscalController } from "../controllers/NotaFiscalController";
import { ListInvoicesUseCase } from "../../application/usecases/notaFiscal/ListInvoicesUseCase";
import { DeleteInvoiceUseCase } from "../../application/usecases/notaFiscal/DeleteInvoiceUseCase";

export const NotaFiscalRoutes = Router();

const repository = new PrismaNotaFiscalRepository();
const notaFiscalUseCase = new NotaFiscalUseCase(repository);
const listInvoicesUseCase = new ListInvoicesUseCase(repository);
const deleteInvoiceUseCase = new DeleteInvoiceUseCase(repository);
const notaFiscalController = new NotaFiscalController(
  notaFiscalUseCase,
  listInvoicesUseCase,
  deleteInvoiceUseCase,
);

NotaFiscalRoutes.post("/nota-fiscal/create", (req, res) =>
  notaFiscalController.create(req, res),
);

NotaFiscalRoutes.get("/nota-fiscal/list", (req, res) =>
  notaFiscalController.list(req, res),
);

NotaFiscalRoutes.delete("/invoices/delete/:id", (req, res) =>
  notaFiscalController.delete(req, res),
);
