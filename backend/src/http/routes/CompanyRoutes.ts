import { Router } from "express";
import { PrismaCompanyRepository } from "../../infrastructure/database/prisma/PrismaCompanyRepository";
import { CreateCompanyUseCase } from "../../application/usecases/company/CreateCompanyUseCase";
import { CompanyController } from "../controllers/CompanyController";
import { ListCompaniesUseCase } from "../../application/usecases/company/ListCompaniesUseCase";

export const CompanyRoutes = Router();

const repository = new PrismaCompanyRepository();

const createCompanyUseCase = new CreateCompanyUseCase(repository);
const listCompaniesUseCase = new ListCompaniesUseCase(repository);

const companyController = new CompanyController(
  createCompanyUseCase,
  listCompaniesUseCase,
);

CompanyRoutes.post("/company/create", (req, res) =>
  companyController.create(req, res),
);

CompanyRoutes.get("/company/list", (_, res) => companyController.list(_, res));
