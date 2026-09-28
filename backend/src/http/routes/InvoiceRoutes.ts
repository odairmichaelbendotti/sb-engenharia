import { Router } from "express";
import { PrismaInvoiceRepository } from "../../infrastructure/database/prisma/PrismaInvoiceRepository.js";
import { InvoiceController } from "../controllers/InvoiceController.js";
import { ListInvoicesUseCase } from "../../application/usecases/invoice/ListInvoicesUseCase.js";
import { DeleteInvoiceUseCase } from "../../application/usecases/invoice/DeleteInvoiceUseCase.js";
import { CreateInvoiceUseCase } from "../../application/usecases/invoice/CreateInvoiceUseCase.js";
import { UpdateInvoiceUseCase } from "../../application/usecases/invoice/UpdateInvoiceUseCase.js";
import { PrismaEmpenhoRepository } from "../../infrastructure/database/prisma/PrismaEmpenhoRepository.js";
import { PrismaObraRepository } from "../../infrastructure/database/prisma/PrismaObraRepository.js";
import { PrismaContratoRepository } from "../../infrastructure/database/prisma/PrismaContratoRepository.js";
import { PrismaCompanyRepository } from "../../infrastructure/database/prisma/PrismaCompanyRepository.js";
import { InvoiceScopeValidator } from "../../application/usecases/invoice/InvoiceScopeValidator.js";
import { ListInvoiceCompanyOptionsUseCase } from "../../application/usecases/invoice/ListInvoiceCompanyOptionsUseCase.js";
import { AuthMiddleware } from "../middleware/AuthMiddleware.js";
import { TokenGenerator } from "../../infrastructure/cryptography/TokenGenerator.js";
import { PrismaUserRepository } from "../../infrastructure/database/prisma/PrismaUserRepository.js";
import { RequireDomainAccess } from "../middleware/RequireDomainAccess.js";

export const InvoiceRoutes = Router();

const repository = new PrismaInvoiceRepository();
const empenhoRepository = new PrismaEmpenhoRepository();
const obraRepository = new PrismaObraRepository();
const contratoRepository = new PrismaContratoRepository();
const companyRepository = new PrismaCompanyRepository();
const scopeValidator = new InvoiceScopeValidator(
  empenhoRepository,
  contratoRepository,
  repository,
  obraRepository,
);
const createInvoice = new CreateInvoiceUseCase(repository, scopeValidator);
const listInvoices = new ListInvoicesUseCase(repository);
const deleteInvoice = new DeleteInvoiceUseCase(repository, scopeValidator);
const updateInvoice = new UpdateInvoiceUseCase(repository, scopeValidator);
const listCompanyOptions = new ListInvoiceCompanyOptionsUseCase(companyRepository);
const requireDomainAccess = new RequireDomainAccess();

const invoiceController = new InvoiceController(
  createInvoice,
  listInvoices,
  deleteInvoice,
  updateInvoice,
  listCompanyOptions,
);

const token = new TokenGenerator();
const userRepository = new PrismaUserRepository();
const authMiddleware = new AuthMiddleware(token, userRepository);

InvoiceRoutes.post(
  "/invoices/create",
  authMiddleware.handle,
  requireDomainAccess.handle("administrativo", "edit"),
  (req, res) => invoiceController.create(req, res),
);

InvoiceRoutes.get(
  "/invoices/list",
  authMiddleware.handle,
  requireDomainAccess.handle("administrativo", "view"),
  (req, res) => invoiceController.list(req, res),
);

InvoiceRoutes.get(
  "/invoices/company-options",
  authMiddleware.handle,
  requireDomainAccess.handle("administrativo", "edit"),
  (req, res) => invoiceController.companyOptions(req, res),
);

InvoiceRoutes.delete(
  "/invoices/delete/:id",
  authMiddleware.handle,
  requireDomainAccess.handle("administrativo", "edit"),
  (req, res) => invoiceController.delete(req, res),
);

InvoiceRoutes.put(
  "/invoices/update/:id",
  authMiddleware.handle,
  requireDomainAccess.handle("administrativo", "edit"),
  (req, res) => invoiceController.update(req, res),
);
