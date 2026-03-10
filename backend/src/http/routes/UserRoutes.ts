import { Router, type Response, type Request } from "express";
import { UserController } from "../controllers/UserController.js";
import { CreateUserUseCase } from "../../application/usecases/CreateUserUseCase.js";
import { PrismaUserRepository } from "../../infrastructure/database/prisma/PrismaUserRepository.js";

export const UserRoutes = Router();

const repository = new PrismaUserRepository();
const createUser = new CreateUserUseCase(repository);
const userController = new UserController(createUser);

UserRoutes.post("/create-user", (req: Request, res: Response) => {
  userController.createUser(req, res);
});
