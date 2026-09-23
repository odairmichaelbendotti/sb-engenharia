import { Router } from "express";
import { PrismaContratoRepository } from "../../infrastructure/database/prisma/PrismaContratoRepository.js";
import { PrismaCompanyRepository } from "../../infrastructure/database/prisma/PrismaCompanyRepository.js";
import { CreateContratoUseCase } from "../../application/usecases/contrato/CreateContratoUseCase.js";
import { ListContratosUseCase } from "../../application/usecases/contrato/ListContratosUseCase.js";
import { ListContratoOptionsForObraUseCase } from "../../application/usecases/contrato/ListContratoOptionsForObraUseCase.js";
import { UpdateContratoUseCase } from "../../application/usecases/contrato/UpdateContratoUseCase.js";
import { UpdateContratoStatusUseCase } from "../../application/usecases/contrato/UpdateContratoStatusUseCase.js";
import { DeleteContratoUseCase } from "../../application/usecases/contrato/DeleteContratoUseCase.js";
import { ContratoController } from "../controllers/ContratoController.js";
import { AuthMiddleware } from "../middleware/AuthMiddleware.js";
import { TokenGenerator } from "../../infrastructure/cryptography/TokenGenerator.js";
import { PrismaUserRepository } from "../../infrastructure/database/prisma/PrismaUserRepository.js";
import { RequireDomainAccess } from "../middleware/RequireDomainAccess.js";

export const ContratoRoutes = Router();

const repository = new PrismaContratoRepository();
const companyRepository = new PrismaCompanyRepository();
const createContratoUseCase = new CreateContratoUseCase(repository, companyRepository);
const listContratosUseCase = new ListContratosUseCase(repository);
const listContratoOptionsForObraUseCase = new ListContratoOptionsForObraUseCase(repository);
const updateContratoUseCase = new UpdateContratoUseCase(repository, companyRepository);
const updateContratoStatusUseCase = new UpdateContratoStatusUseCase(repository);
const deleteContratoUseCase = new DeleteContratoUseCase(repository);

const contratoController = new ContratoController(
  createContratoUseCase,
  listContratosUseCase,
  listContratoOptionsForObraUseCase,
  updateContratoUseCase,
  updateContratoStatusUseCase,
  deleteContratoUseCase,
);

const token = new TokenGenerator();
const userRepository = new PrismaUserRepository();
const authMiddleware = new AuthMiddleware(token, userRepository);

const requireDomainAccess = new RequireDomainAccess();

ContratoRoutes.post(
  "/contrato/create",
  authMiddleware.handle,
  requireDomainAccess.handle("administrativo", "edit"),
  (req, res) => contratoController.create(req, res),
);

ContratoRoutes.get(
  "/contrato/list",
  authMiddleware.handle,
  requireDomainAccess.handle("administrativo", "view"),
  (req, res) => contratoController.list(req, res),
);

// Rota estreita: expõe só identificador/descrição curta dos contratos ativos e
// seus empenhos — usada pelo select em cascata do ObraModal. Um empenho pode
// ser vinculado a mais de uma obra, então a lista não filtra por vínculo já
// existente. Não retorna valor/empresa/dados administrativos, por isso libera
// pra quem só tem acesso de edição em Engenharia (sem view geral de Administrativo).
ContratoRoutes.get(
  "/contrato/list-for-obra",
  authMiddleware.handle,
  requireDomainAccess.handle("engenharia", "edit"),
  (req, res) => contratoController.listOptionsForObra(req, res),
);

ContratoRoutes.put(
  "/contrato/update/:id",
  authMiddleware.handle,
  requireDomainAccess.handle("administrativo", "edit"),
  (req, res) => contratoController.update(req, res),
);

ContratoRoutes.put(
  "/contrato/update-status/:id",
  authMiddleware.handle,
  requireDomainAccess.handle("administrativo", "edit"),
  (req, res) => contratoController.updateStatus(req, res),
);

ContratoRoutes.delete(
  "/contrato/delete/:id",
  authMiddleware.handle,
  requireDomainAccess.handle("administrativo", "edit"),
  (req, res) => contratoController.delete(req, res),
);
