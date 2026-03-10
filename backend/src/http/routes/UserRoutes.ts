import { Router, type Response, type Request } from "express";
import { UserController } from "../controllers/UserController.js";
import { CreateUserUseCase } from "../../application/usecases/CreateUserUseCase.js";
import { PrismaUserRepository } from "../../infrastructure/database/prisma/PrismaUserRepository.js";
import { HashGenerator } from "../../infrastructure/cryptography/Hasher.js";

export const UserRoutes = Router();

const repository = new PrismaUserRepository();
const hash = new HashGenerator();
const createUser = new CreateUserUseCase(repository, hash);
const userController = new UserController(createUser);

UserRoutes.post("/signup", (req: Request, res: Response) => {
  userController.createUser(req, res);
});
