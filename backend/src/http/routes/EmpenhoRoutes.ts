import { Router } from "express";
import { PrismaEmpenhoRepository } from "../../infrastructure/database/prisma/PrismaEmpenhoRepository";
import { CreateEmpenhoUseCase } from "../../application/usecases/empenho/CreateEmpenhoUseCase";
import { EmpenhoController } from "../controllers/EmpenhoController";
import { ListEmpenhosUseCase } from "../../application/usecases/empenho/ListEmpenhosUseCase";

export const EmpenhoRoutes = Router();

const repository = new PrismaEmpenhoRepository();
const createEmpenhoUseCase = new CreateEmpenhoUseCase(repository);
const listEmpenhosUseCase = new ListEmpenhosUseCase(repository);
const empenhoController = new EmpenhoController(
  createEmpenhoUseCase,
  listEmpenhosUseCase,
);

EmpenhoRoutes.post("/empenho/create", (req, res) =>
  empenhoController.create(req, res),
);

EmpenhoRoutes.get("/empenho/list", (req, res) =>
  empenhoController.list(req, res),
);
