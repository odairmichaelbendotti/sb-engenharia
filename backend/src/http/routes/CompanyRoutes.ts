import { Router } from "express";
import { PrismaCompanyRepository } from "../../infrastructure/database/prisma/PrismaCompanyRepository";
import { CompanyUseCase } from "../../application/usecases/CompanyUseCase";
import { CompanyController } from "../controllers/CompanyController";

export const CompanyRoutes = Router();

const repository = new PrismaCompanyRepository();
const createCompanyUseCase = new CompanyUseCase(repository);
const companyController = new CompanyController(createCompanyUseCase);

CompanyRoutes.post("/company/create", (req, res) =>
  companyController.create(req, res),
);
