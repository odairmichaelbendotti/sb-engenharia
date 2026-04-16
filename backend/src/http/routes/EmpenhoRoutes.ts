import { Router } from "express";
import { PrismaEmpenhoRepository } from "../../infrastructure/database/prisma/PrismaEmpenhoRepository";
import { CreateEmpenhoUseCase } from "../../application/usecases/empenho/CreateEmpenhoUseCase";
import { EmpenhoController } from "../controllers/EmpenhoController";
import { ListEmpenhosUseCase } from "../../application/usecases/empenho/ListEmpenhosUseCase";
import { DeleteEmpenhoUseCase } from "../../application/usecases/empenho/DeleteEmpenhoUseCase";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { TokenGenerator } from "../../infrastructure/cryptography/TokenGenerator";

export const EmpenhoRoutes = Router();

const repository = new PrismaEmpenhoRepository();
const createEmpenhoUseCase = new CreateEmpenhoUseCase(repository);
const listEmpenhosUseCase = new ListEmpenhosUseCase(repository);
const deleteEmpenhoUseCase = new DeleteEmpenhoUseCase(repository);
const empenhoController = new EmpenhoController(
  createEmpenhoUseCase,
  listEmpenhosUseCase,
  deleteEmpenhoUseCase,
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
