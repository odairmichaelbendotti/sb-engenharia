import { Router } from "express";
import { PrismaNotaFiscalRepository } from "../../infrastructure/database/prisma/PrismaNotaFiscalRepository";
import { NotaFiscalController } from "../controllers/NotaFiscalController";
import { ListInvoicesUseCase } from "../../application/usecases/notaFiscal/ListInvoicesUseCase";
import { DeleteInvoiceUseCase } from "../../application/usecases/notaFiscal/DeleteInvoiceUseCase";
import { CreateInvoiceUseCase } from "../../application/usecases/notaFiscal/CreateInvoiceUseCase";

export const NotaFiscalRoutes = Router();

const repository = new PrismaNotaFiscalRepository();
const createInvoice = new CreateInvoiceUseCase(repository);
const listInvoices = new ListInvoicesUseCase(repository);
const deleteInvoice = new DeleteInvoiceUseCase(repository);
const notaFiscalController = new NotaFiscalController(
  createInvoice,
  listInvoices,
  deleteInvoice,
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
