import { Router } from "express";
import { PrismaOrdemServicoRepository } from "../../infrastructure/database/prisma/PrismaOrdemServicoRepository.js";
import { PrismaEmpenhoRepository } from "../../infrastructure/database/prisma/PrismaEmpenhoRepository.js";
import { CreateOrdemServicoUseCase } from "../../application/usecases/ordem-servico/CreateOrdemServicoUseCase.js";
import { ListOrdensServicoUseCase } from "../../application/usecases/ordem-servico/ListOrdensServicoUseCase.js";
import { ListOrdemServicoOptionsForObraUseCase } from "../../application/usecases/ordem-servico/ListOrdemServicoOptionsForObraUseCase.js";
import { UpdateOrdemServicoUseCase } from "../../application/usecases/ordem-servico/UpdateOrdemServicoUseCase.js";
import { UpdateOrdemServicoStatusUseCase } from "../../application/usecases/ordem-servico/UpdateOrdemServicoStatusUseCase.js";
import { DeleteOrdemServicoUseCase } from "../../application/usecases/ordem-servico/DeleteOrdemServicoUseCase.js";
import { OrdemServicoController } from "../controllers/OrdemServicoController.js";
import { AuthMiddleware } from "../middleware/AuthMiddleware.js";
import { TokenGenerator } from "../../infrastructure/cryptography/TokenGenerator.js";
import { PrismaUserRepository } from "../../infrastructure/database/prisma/PrismaUserRepository.js";
import { RequireDomainAccess } from "../middleware/RequireDomainAccess.js";

export const OrdemServicoRoutes = Router();

const repository = new PrismaOrdemServicoRepository();
const empenhoRepository = new PrismaEmpenhoRepository();
const createOrdemServicoUseCase = new CreateOrdemServicoUseCase(repository, empenhoRepository);
const listOrdensServicoUseCase = new ListOrdensServicoUseCase(repository);
const listOrdemServicoOptionsForObraUseCase = new ListOrdemServicoOptionsForObraUseCase(repository);
const updateOrdemServicoUseCase = new UpdateOrdemServicoUseCase(repository, empenhoRepository);
const updateOrdemServicoStatusUseCase = new UpdateOrdemServicoStatusUseCase(repository);
const deleteOrdemServicoUseCase = new DeleteOrdemServicoUseCase(repository);

const ordemServicoController = new OrdemServicoController(
  createOrdemServicoUseCase,
  listOrdensServicoUseCase,
  listOrdemServicoOptionsForObraUseCase,
  updateOrdemServicoUseCase,
  updateOrdemServicoStatusUseCase,
  deleteOrdemServicoUseCase,
);

const token = new TokenGenerator();
const userRepository = new PrismaUserRepository();
const authMiddleware = new AuthMiddleware(token, userRepository);

const requireDomainAccess = new RequireDomainAccess();

OrdemServicoRoutes.post(
  "/ordem-servico/create",
  authMiddleware.handle,
  requireDomainAccess.handle("administrativo", "edit"),
  (req, res) => ordemServicoController.create(req, res),
);

OrdemServicoRoutes.get(
  "/ordem-servico/list",
  authMiddleware.handle,
  requireDomainAccess.handle("administrativo", "view"),
  (req, res) => ordemServicoController.list(req, res),
);

// Rota estreita: expõe só numero/valor das ordens de serviço ativas e ainda sem
// obra vinculada, com o empenho/contrato/empresa aninhados só pra exibição —
// usada pelo select do ObraModal. Não retorna dado administrativo completo, por
// isso libera pra quem só tem acesso de edição em Engenharia (mesmo padrão já
// usado em `contrato/list-for-obra`).
OrdemServicoRoutes.get(
  "/ordem-servico/list-for-obra",
  authMiddleware.handle,
  requireDomainAccess.handle("engenharia", "edit"),
  (req, res) => ordemServicoController.listOptionsForObra(req, res),
);

OrdemServicoRoutes.put(
  "/ordem-servico/update/:id",
  authMiddleware.handle,
  requireDomainAccess.handle("administrativo", "edit"),
  (req, res) => ordemServicoController.update(req, res),
);

OrdemServicoRoutes.put(
  "/ordem-servico/update-status/:id",
  authMiddleware.handle,
  requireDomainAccess.handle("administrativo", "edit"),
  (req, res) => ordemServicoController.updateStatus(req, res),
);

OrdemServicoRoutes.delete(
  "/ordem-servico/delete/:id",
  authMiddleware.handle,
  requireDomainAccess.handle("administrativo", "edit"),
  (req, res) => ordemServicoController.delete(req, res),
);
