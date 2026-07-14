import { Router } from "express";
import { PrismaInvoiceRepository } from "../../infrastructure/database/prisma/PrismaInvoiceRepository.js";
import { InvoiceController } from "../controllers/InvoiceController.js";
import { ListInvoicesUseCase } from "../../application/usecases/invoice/ListInvoicesUseCase.js";
import { DeleteInvoiceUseCase } from "../../application/usecases/invoice/DeleteInvoiceUseCase.js";
import { CreateInvoiceUseCase } from "../../application/usecases/invoice/CreateInvoiceUseCase.js";
import { UpdateInvoiceUseCase } from "../../application/usecases/invoice/UpdateInvoiceUseCase.js";
import { PrismaEmpenhoRepository } from "../../infrastructure/database/prisma/PrismaEmpenhoRepository.js";
import { AuthMiddleware } from "../middleware/AuthMiddleware.js";
import { TokenGenerator } from "../../infrastructure/cryptography/TokenGenerator.js";
import { PrismaUserRepository } from "../../infrastructure/database/prisma/PrismaUserRepository.js";
import { RequiredRoles } from "../middleware/RequiredRoles.js";

export const InvoiceRoutes = Router();

const repository = new PrismaInvoiceRepository();
const empenhoRepository = new PrismaEmpenhoRepository();
const createInvoice = new CreateInvoiceUseCase(repository, empenhoRepository);
const listInvoices = new ListInvoicesUseCase(repository);
const deleteInvoice = new DeleteInvoiceUseCase(repository);
const updateInvoice = new UpdateInvoiceUseCase(repository);
const requiredRoles = new RequiredRoles();

const invoiceController = new InvoiceController(
  createInvoice,
  listInvoices,
  deleteInvoice,
  updateInvoice,
);

const token = new TokenGenerator();
const userRepository = new PrismaUserRepository();
const authMiddleware = new AuthMiddleware(token, userRepository);

InvoiceRoutes.post(
  "/invoices/create",
  authMiddleware.handle,
  requiredRoles.handle("EDITOR", "MASTER", "PLATFORM_ADMIN"),
  (req, res) => invoiceController.create(req, res),
);

InvoiceRoutes.get("/invoices/list", authMiddleware.handle, (req, res) =>
  invoiceController.list(req, res),
);

InvoiceRoutes.delete(
  "/invoices/delete/:id",
  authMiddleware.handle,
  requiredRoles.handle("EDITOR", "MASTER", "PLATFORM_ADMIN"),
  (req, res) => invoiceController.delete(req, res),
);

InvoiceRoutes.put(
  "/invoices/update/:id",
  authMiddleware.handle,
  requiredRoles.handle("EDITOR", "MASTER", "PLATFORM_ADMIN"),
  (req, res) => invoiceController.update(req, res),
);
