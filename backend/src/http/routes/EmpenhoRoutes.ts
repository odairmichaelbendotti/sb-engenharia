import { Router } from "express";
import { PrismaEmpenhoRepository } from "../../infrastructure/database/prisma/PrismaEmpenhoRepository";
import { EmpenhoUseCase } from "../../application/usecases/EmpenhoUseCase";
import { EmpenhoController } from "../controllers/EmpenhoController";

export const EmpenhoRoutes = Router();

const repository = new PrismaEmpenhoRepository();
const createEmpenhoUseCase = new EmpenhoUseCase(repository);
const empenhoController = new EmpenhoController(createEmpenhoUseCase);

EmpenhoRoutes.post("/empenho/create", (req, res) =>
  empenhoController.create(req, res),
);
