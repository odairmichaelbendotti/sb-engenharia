import { Router } from "express";
import { PrismaTenantRepository } from "../../infrastructure/database/prisma/PrismaTenantRepository.js";
import { CreateTenantUseCase } from "../../application/usecases/tenant/CreateTenantUseCase.js";
import { TenantController } from "../controllers/TenantController.js";

export const TenantRoutes = Router();

const repository = new PrismaTenantRepository();

const createTenantUseCase = new CreateTenantUseCase(repository);

const tenantController = new TenantController(createTenantUseCase);

TenantRoutes.post("/tenant/create", (req, res) =>
  tenantController.create(req, res),
);
