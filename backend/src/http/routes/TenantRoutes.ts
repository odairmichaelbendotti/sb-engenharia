import { Router } from "express";
import { PrismaTenantRepository } from "../../infrastructure/database/prisma/PrismaTenantRepository.js";
import { PrismaContratoRepository } from "../../infrastructure/database/prisma/PrismaContratoRepository.js";
import { PrismaEmpenhoRepository } from "../../infrastructure/database/prisma/PrismaEmpenhoRepository.js";
import { PrismaOrdemServicoRepository } from "../../infrastructure/database/prisma/PrismaOrdemServicoRepository.js";
import { PrismaObraRepository } from "../../infrastructure/database/prisma/PrismaObraRepository.js";
import { PrismaInvoiceRepository } from "../../infrastructure/database/prisma/PrismaInvoiceRepository.js";
import { CreateTenantUseCase } from "../../application/usecases/tenant/CreateTenantUseCase.js";
import { TenantController } from "../controllers/TenantController.js";
import { GetTenantsUseCase } from "../../application/usecases/tenant/GetTenantsUseCase.js";
import { ListTenantOptionsUseCase } from "../../application/usecases/tenant/ListTenantOptionsUseCase.js";
import { GetMyTenantUseCase } from "../../application/usecases/tenant/GetMyTenantUseCase.js";
import { GetTenantsSummaryUseCase } from "../../application/usecases/tenant/GetTenantsSummaryUseCase.js";
import { AuthMiddleware } from "../middleware/AuthMiddleware.js";
import { RequiredRoles } from "../middleware/RequiredRoles.js";
import { TokenGenerator } from "../../infrastructure/cryptography/TokenGenerator.js";
import { PrismaUserRepository } from "../../infrastructure/database/prisma/PrismaUserRepository.js";

export const TenantRoutes = Router();

const repository = new PrismaTenantRepository();
const createTenantUseCase = new CreateTenantUseCase(repository);
const getTenantsUseCase = new GetTenantsUseCase(repository);
const listTenantOptionsUseCase = new ListTenantOptionsUseCase(repository);
const getMyTenantUseCase = new GetMyTenantUseCase(repository);
const getTenantsSummaryUseCase = new GetTenantsSummaryUseCase(
  repository,
  new PrismaContratoRepository(),
  new PrismaEmpenhoRepository(),
  new PrismaOrdemServicoRepository(),
  new PrismaObraRepository(),
  new PrismaInvoiceRepository(),
);
const tenantController = new TenantController(
  createTenantUseCase,
  getTenantsUseCase,
  listTenantOptionsUseCase,
  getMyTenantUseCase,
  getTenantsSummaryUseCase,
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

// Resumo agregado por tenant (contratos/empenhos/OS/obras/notas fiscais) —
// alimenta o card "por instituição" no Dashboard do PLATFORM_ADMIN. Não expõe
// listas, só números já somados no servidor.
TenantRoutes.get(
  "/tenant/summary",
  authMiddleware.handle,
  requiredRoles.handle("PLATFORM_ADMIN"),
  (req, res) => tenantController.summary(req, res),
);

// Pública (sem AuthMiddleware) — usada pelo formulário de cadastro (SignUp),
// onde ainda não existe usuário autenticado. Só expõe id/name, nunca os
// campos sensíveis do tenant (cnpj, endereço, telefone, e-mail).
TenantRoutes.get("/tenant/list-public", (req, res) =>
  tenantController.listPublicOptions(req, res),
);

// Qualquer role autenticada (não só PLATFORM_ADMIN) — usada para centralizar
// o mapa na localização do próprio tenant. Só expõe id/name/latitude/longitude.
TenantRoutes.get("/tenant/me", authMiddleware.handle, (req, res) =>
  tenantController.me(req, res),
);
