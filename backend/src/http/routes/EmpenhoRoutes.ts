import { Router } from "express";
import { PrismaEmpenhoRepository } from "../../infrastructure/database/prisma/PrismaEmpenhoRepository";
import { CreateEmpenhoUseCase } from "../../application/usecases/empenho/CreateEmpenhoUseCase";
import { EmpenhoController } from "../controllers/EmpenhoController";
import { ListEmpenhosUseCase } from "../../application/usecases/empenho/ListEmpenhosUseCase";
import { DeleteEmpenhoUseCase } from "../../application/usecases/empenho/DeleteEmpenhoUseCase";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { TokenGenerator } from "../../infrastructure/cryptography/TokenGenerator";
import { UpdateEmpenhoUseCase } from "../../application/usecases/empenho/UpdateEmpenhoUseCase";
import { PrismaCompanyRepository } from "../../infrastructure/database/prisma/PrismaCompanyRepository";

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
const empenhoController = new EmpenhoController(
  createEmpenhoUseCase,
  listEmpenhosUseCase,
  deleteEmpenhoUseCase,
  updateEmpenhoUseCase,
);
const token = new TokenGenerator();
const authMiddleware = new AuthMiddleware(token);

EmpenhoRoutes.post("/empenho/create", authMiddleware.handle, (req, res) =>
  empenhoController.create(req, res),
);

EmpenhoRoutes.get("/empenho/list", (req, res) =>
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
