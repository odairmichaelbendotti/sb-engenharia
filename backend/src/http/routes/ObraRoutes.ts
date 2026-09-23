import { Router } from "express";
import { PrismaObraRepository } from "../../infrastructure/database/prisma/PrismaObraRepository.js";
import { PrismaOrdemServicoRepository } from "../../infrastructure/database/prisma/PrismaOrdemServicoRepository.js";
import { CreateObraUseCase } from "../../application/usecases/obra/CreateObraUseCase.js";
import { ListObrasUseCase } from "../../application/usecases/obra/ListObrasUseCase.js";
import { ListObraOptionsForInvoiceUseCase } from "../../application/usecases/obra/ListObraOptionsForInvoiceUseCase.js";
import { UpdateObraUseCase } from "../../application/usecases/obra/UpdateObraUseCase.js";
import { UpdateObraStatusUseCase } from "../../application/usecases/obra/UpdateObraStatusUseCase.js";
import { DeleteObraUseCase } from "../../application/usecases/obra/DeleteObraUseCase.js";
import { ObraController } from "../controllers/ObraController.js";
import { AuthMiddleware } from "../middleware/AuthMiddleware.js";
import { TokenGenerator } from "../../infrastructure/cryptography/TokenGenerator.js";
import { PrismaUserRepository } from "../../infrastructure/database/prisma/PrismaUserRepository.js";
import { RequireDomainAccess } from "../middleware/RequireDomainAccess.js";

export const ObraRoutes = Router();

const repository = new PrismaObraRepository();
const ordemServicoRepository = new PrismaOrdemServicoRepository();
const createObraUseCase = new CreateObraUseCase(repository, ordemServicoRepository);
const listObrasUseCase = new ListObrasUseCase(repository);
const listObraOptionsForInvoiceUseCase = new ListObraOptionsForInvoiceUseCase(repository);
const updateObraUseCase = new UpdateObraUseCase(repository);
const updateObraStatusUseCase = new UpdateObraStatusUseCase(repository);
const deleteObraUseCase = new DeleteObraUseCase(repository);

const obraController = new ObraController(
  createObraUseCase,
  listObrasUseCase,
  updateObraUseCase,
  updateObraStatusUseCase,
  deleteObraUseCase,
  listObraOptionsForInvoiceUseCase,
);

const token = new TokenGenerator();
const userRepository = new PrismaUserRepository();
const authMiddleware = new AuthMiddleware(token, userRepository);

const requireDomainAccess = new RequireDomainAccess();

ObraRoutes.post(
  "/obra/create",
  authMiddleware.handle,
  requireDomainAccess.handle("engenharia", "edit"),
  (req, res) => obraController.create(req, res),
);
ObraRoutes.get(
  "/obra/list",
  authMiddleware.handle,
  requireDomainAccess.handle("engenharia", "view"),
  (req, res) => obraController.list(req, res),
);
// Rota estreita: expõe só id/nome/identificacaoPatrimonial das obras vinculadas
// a um empenho específico — usada pelo select de Obra na criação/edição de
// Nota Fiscal. Quem chama está no domínio administrativo (não engenharia), por
// isso o gate é o inverso do padrão já usado em contrato/list-for-obra e
// ordem-servico/list-for-obra (que liberam pra engenharia acessar dado
// administrativo estreito).
ObraRoutes.get(
  "/obra/list-for-invoice",
  authMiddleware.handle,
  requireDomainAccess.handle("administrativo", "edit"),
  (req, res) => obraController.listOptionsForInvoice(req, res),
);
ObraRoutes.put(
  "/obra/update/:id",
  authMiddleware.handle,
  requireDomainAccess.handle("engenharia", "edit"),
  (req, res) => obraController.update(req, res),
);
ObraRoutes.put(
  "/obra/update-status/:id",
  authMiddleware.handle,
  requireDomainAccess.handle("engenharia", "edit"),
  (req, res) => obraController.updateStatus(req, res),
);
ObraRoutes.delete(
  "/obra/delete/:id",
  authMiddleware.handle,
  requireDomainAccess.handle("engenharia", "edit"),
  (req, res) => obraController.delete(req, res),
);
