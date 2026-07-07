import { Router } from "express";
import { PrismaEmpenhoRepository } from "../../infrastructure/database/prisma/PrismaEmpenhoRepository.js";
import { CreateEmpenhoUseCase } from "../../application/usecases/empenho/CreateEmpenhoUseCase.js";
import { EmpenhoController } from "../controllers/EmpenhoController.js";
import { ListEmpenhosUseCase } from "../../application/usecases/empenho/ListEmpenhosUseCase.js";
import { DeleteEmpenhoUseCase } from "../../application/usecases/empenho/DeleteEmpenhoUseCase.js";
import { AuthMiddleware } from "../middleware/AuthMiddleware.js";
import { TokenGenerator } from "../../infrastructure/cryptography/TokenGenerator.js";
import { PrismaUserRepository } from "../../infrastructure/database/prisma/PrismaUserRepository.js";
import { UpdateEmpenhoUseCase } from "../../application/usecases/empenho/UpdateEmpenhoUseCase.js";
import { PrismaCompanyRepository } from "../../infrastructure/database/prisma/PrismaCompanyRepository.js";
import { UpdateStatusEmpenhoUseCase } from "../../application/usecases/empenho/UpdateEmpenhoStatusUseCase.js";

export const EmpenhoRoutes = Router();

const repository = new PrismaEmpenhoRepository();
const createEmpenhoUseCase = new CreateEmpenhoUseCase(repository);
const listEmpenhosUseCase = new ListEmpenhosUseCase(repository);
const deleteEmpenhoUseCase = new DeleteEmpenhoUseCase(repository);
const findCompanyById = new PrismaCompanyRepository();
const updateEmpenhoUseCase = new UpdateEmpenhoUseCase(
  repository,
  findCompanyById,
);
const updateStatusEmpenhoUseCase = new UpdateStatusEmpenhoUseCase(repository);
const empenhoController = new EmpenhoController(
  createEmpenhoUseCase,
  listEmpenhosUseCase,
  deleteEmpenhoUseCase,
  updateEmpenhoUseCase,
  updateStatusEmpenhoUseCase,
);
const token = new TokenGenerator();
const userRepository = new PrismaUserRepository();
const authMiddleware = new AuthMiddleware(token, userRepository);

EmpenhoRoutes.post("/empenho/create", authMiddleware.handle, (req, res) =>
  empenhoController.create(req, res),
);

EmpenhoRoutes.get("/empenho/list", authMiddleware.handle, (req, res) =>
  empenhoController.list(req, res),
);

EmpenhoRoutes.delete(
  "/empenho/delete/:empenhoId",
  authMiddleware.handle,
  (req, res) => empenhoController.delete(req, res),
);

EmpenhoRoutes.put(
  "/empenho/update/:empenhoId",
  authMiddleware.handle,
  (req, res) => empenhoController.update(req, res),
);

EmpenhoRoutes.put(
  "/empenho/update-status/:empenhoId",
  authMiddleware.handle,
  (req, res) => empenhoController.updateStatus(req, res),
);
