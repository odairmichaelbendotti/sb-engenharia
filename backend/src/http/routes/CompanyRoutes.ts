import { Router } from "express";
import { PrismaCompanyRepository } from "../../infrastructure/database/prisma/PrismaCompanyRepository.js";
import { CreateCompanyUseCase } from "../../application/usecases/company/CreateCompanyUseCase.js";
import { CompanyController } from "../controllers/CompanyController.js";
import { ListCompaniesUseCase } from "../../application/usecases/company/ListCompaniesUseCase.js";
import { DeleteCompanyUseCase } from "../../application/usecases/company/DeleteCompanyUseCase.js";
import { UpdateCompanyUseCase } from "../../application/usecases/company/UpdateCompanyUseCase.js";

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

CompanyRoutes.post("/company/create", (req, res) =>
  companyController.create(req, res),
);

CompanyRoutes.get("/company/list", (_, res) => companyController.list(_, res));

CompanyRoutes.delete("/company/delete/:id", (req, res) =>
  companyController.delete(req, res),
);

CompanyRoutes.put("/company/update/:id", (req, res) =>
  companyController.update(req, res),
);
