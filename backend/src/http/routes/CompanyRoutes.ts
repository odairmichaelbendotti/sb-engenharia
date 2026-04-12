import { Router } from "express";
import { PrismaCompanyRepository } from "../../infrastructure/database/prisma/PrismaCompanyRepository";
import { CreateCompanyUseCase } from "../../application/usecases/company/CreateCompanyUseCase";
import { CompanyController } from "../controllers/CompanyController";
import { ListCompaniesUseCase } from "../../application/usecases/company/ListCompaniesUseCase";
import { DeleteCompanyUseCase } from "../../application/usecases/company/DeleteCompanyUseCase";
import { UpdateCompanyUseCase } from "../../application/usecases/company/UpdateCompanyUseCase";

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
