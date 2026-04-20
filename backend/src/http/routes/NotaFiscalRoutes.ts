import { Router } from "express";
import { PrismaNotaFiscalRepository } from "../../infrastructure/database/prisma/PrismaNotaFiscalRepository";
import { NotaFiscalController } from "../controllers/NotaFiscalController";
import { ListInvoicesUseCase } from "../../application/usecases/notaFiscal/ListInvoicesUseCase";
import { DeleteInvoiceUseCase } from "../../application/usecases/notaFiscal/DeleteInvoiceUseCase";
import { CreateInvoiceUseCase } from "../../application/usecases/notaFiscal/CreateInvoiceUseCase";
import { UpdateCompanyUseCase } from "../../application/usecases/company/UpdateCompanyUseCase";
import { UpdateInvoiceUseCase } from "../../application/usecases/notaFiscal/UpdateInvoiceUseCase";
import { PrismaEmpenhoRepository } from "../../infrastructure/database/prisma/PrismaEmpenhoRepository";

export const NotaFiscalRoutes = Router();

const repository = new PrismaNotaFiscalRepository();
const empenhoRepository = new PrismaEmpenhoRepository();
const createInvoice = new CreateInvoiceUseCase(repository, empenhoRepository);
const listInvoices = new ListInvoicesUseCase(repository);
const deleteInvoice = new DeleteInvoiceUseCase(repository);
const updateInvoice = new UpdateInvoiceUseCase(repository);

const notaFiscalController = new NotaFiscalController(
  createInvoice,
  listInvoices,
  deleteInvoice,
  updateInvoice,
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

NotaFiscalRoutes.put("/invoices/update/:id", (req, res) =>
  notaFiscalController.update(req, res),
);
