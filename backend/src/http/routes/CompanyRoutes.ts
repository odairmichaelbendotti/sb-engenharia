import { Router } from "express";
import { PrismaCompanyRepository } from "../../infrastructure/database/prisma/PrismaCompanyRepository.js";
import { CreateCompanyUseCase } from "../../application/usecases/company/CreateCompanyUseCase.js";
import { CompanyController } from "../controllers/CompanyController.js";
import { ListCompaniesUseCase } from "../../application/usecases/company/ListCompaniesUseCase.js";
import { DeleteCompanyUseCase } from "../../application/usecases/company/DeleteCompanyUseCase.js";
import { UpdateCompanyUseCase } from "../../application/usecases/company/UpdateCompanyUseCase.js";
import { AuthMiddleware } from "../middleware/AuthMiddleware.js";
import { TokenGenerator } from "../../infrastructure/cryptography/TokenGenerator.js";
import { PrismaUserRepository } from "../../infrastructure/database/prisma/PrismaUserRepository.js";
import { RequireDomainAccess } from "../middleware/RequireDomainAccess.js";

export const CompanyRoutes = Router();

const repository = new PrismaCompanyRepository();

const createCompanyUseCase = new CreateCompanyUseCase(repository);
const listCompaniesUseCase = new ListCompaniesUseCase(repository);
const deleteCompanyUseCase = new DeleteCompanyUseCase(repository);
const updateCompanyUseCase = new UpdateCompanyUseCase(repository);

const companyController = new CompanyController(
  createCompanyUseCase,
  listCompaniesUseCase,
  deleteCompanyUseCase,
  updateCompanyUseCase,
);

const token = new TokenGenerator();
const userRepository = new PrismaUserRepository();
const authMiddleware = new AuthMiddleware(token, userRepository);

const requireDomainAccess = new RequireDomainAccess();

CompanyRoutes.post(
  "/company/create",
  authMiddleware.handle,
  requireDomainAccess.handle("administrativo", "edit"),
  (req, res) => companyController.create(req, res),
);

CompanyRoutes.get(
  "/company/list",
  authMiddleware.handle,
  requireDomainAccess.handle("administrativo", "view"),
  (req, res) => companyController.list(req, res),
);

CompanyRoutes.delete(
  "/company/delete/:id",
  authMiddleware.handle,
  requireDomainAccess.handle("administrativo", "edit"),
  (req, res) => companyController.delete(req, res),
);

CompanyRoutes.put(
  "/company/update/:id",
  authMiddleware.handle,
  requireDomainAccess.handle("administrativo", "edit"),
  (req, res) => companyController.update(req, res),
);
