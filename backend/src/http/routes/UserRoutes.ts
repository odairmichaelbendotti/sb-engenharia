import { Router, type Response, type Request } from "express";
import { UserController } from "../controllers/UserController.js";
import { SignUpUseCase } from "../../application/usecases/SingnUpUseCase.js";
import { PrismaUserRepository } from "../../infrastructure/database/prisma/PrismaUserRepository.js";
import { HashGenerator } from "../../infrastructure/cryptography/HashGenerator.js";
import { SignInUseCase } from "../../application/usecases/SignInUseCase.js";
import { TokenGenerator } from "../../infrastructure/cryptography/TokenGenerator.js";

export const UserRoutes = Router();

const repository = new PrismaUserRepository();
const hash = new HashGenerator();
const token = new TokenGenerator();
const signUp = new SignUpUseCase(repository, hash, token);
const signIn = new SignInUseCase(repository, hash, token);
const userController = new UserController(signUp, signIn);

UserRoutes.post("/signup", (req: Request, res: Response) => {
  userController.signup(req, res);
});

UserRoutes.post("/signin", (req: Request, res: Response) => {
  userController.signin(req, res);
});
