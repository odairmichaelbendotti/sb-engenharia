import { Router } from "express";
import { PrismaCompanyRepository } from "../../infrastructure/database/prisma/PrismaCompanyRepository";
import { CreateCompanyUseCase } from "../../application/usecases/company/CreateCompanyUseCase";
import { CompanyController } from "../controllers/CompanyController";

export const CompanyRoutes = Router();

const repository = new PrismaCompanyRepository();
const createCompanyUseCase = new CreateCompanyUseCase(repository);
const companyController = new CompanyController(createCompanyUseCase);

CompanyRoutes.post("/company/create", (req, res) =>
  companyController.create(req, res),
);
