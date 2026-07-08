import { Router } from "express";
import { PrismaTenantRepository } from "../../infrastructure/database/prisma/PrismaTenantRepository.js";
import { CreateTenantUseCase } from "../../application/usecases/tenant/CreateTenantUseCase.js";
import { TenantController } from "../controllers/TenantController.js";
import { GetTenantsUseCase } from "../../application/usecases/tenant/GetTenantsUseCase.js";

export const TenantRoutes = Router();

const repository = new PrismaTenantRepository();
const createTenantUseCase = new CreateTenantUseCase(repository);
const getTenantsUseCase = new GetTenantsUseCase(repository);
const tenantController = new TenantController(
  createTenantUseCase,
  getTenantsUseCase,
);

TenantRoutes.post("/tenant/create", (req, res) =>
  tenantController.create(req, res),
);

TenantRoutes.get("/tenant/get-all", (req, res) =>
  tenantController.getAll(req, res),
);
