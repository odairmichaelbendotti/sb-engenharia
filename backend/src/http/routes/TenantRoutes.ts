import { Router } from "express";
import { PrismaTenantRepository } from "../../infrastructure/database/prisma/PrismaTenantRepository.js";
import { CreateTenantUseCase } from "../../application/usecases/tenant/CreateTenantUseCase.js";
import { TenantController } from "../controllers/TenantController.js";
import { GetTenantsUseCase } from "../../application/usecases/tenant/GetTenantsUseCase.js";
import { AuthMiddleware } from "../middleware/AuthMiddleware.js";
import { RequiredRoles } from "../middleware/RequiredRoles.js";
import { TokenGenerator } from "../../infrastructure/cryptography/TokenGenerator.js";
import { PrismaUserRepository } from "../../infrastructure/database/prisma/PrismaUserRepository.js";

export const TenantRoutes = Router();

const repository = new PrismaTenantRepository();
const createTenantUseCase = new CreateTenantUseCase(repository);
const getTenantsUseCase = new GetTenantsUseCase(repository);
const tenantController = new TenantController(
  createTenantUseCase,
  getTenantsUseCase,
);
const tokenValidator = new TokenGenerator();
const userRepository = new PrismaUserRepository();
const authMiddleware = new AuthMiddleware(tokenValidator, userRepository);
const requiredRoles = new RequiredRoles();

TenantRoutes.post(
  "/tenant/create",
  authMiddleware.handle,
  requiredRoles.handle("PLATFORM_ADMIN"),
  (req, res) => tenantController.create(req, res),
);

TenantRoutes.get(
  "/tenant/get-all",
  authMiddleware.handle,
  requiredRoles.handle("PLATFORM_ADMIN"),
  (req, res) => tenantController.getAll(req, res),
);
