import { Router, type Response, type Request } from "express";
import { UserController } from "../controllers/UserController.js";
import { SignUpUseCase } from "../../application/usecases/user/SingnUpUseCase.js";
import { PrismaUserRepository } from "../../infrastructure/database/prisma/PrismaUserRepository.js";
import { HashGenerator } from "../../infrastructure/cryptography/HashGenerator.js";
import { SignInUseCase } from "../../application/usecases/user/SignInUseCase.js";
import { TokenGenerator } from "../../infrastructure/cryptography/TokenGenerator.js";
import { AuthMiddleware } from "../middleware/AuthMiddleware.js";

export const UserRoutes = Router();

const repository = new PrismaUserRepository();
const hash = new HashGenerator();
const token = new TokenGenerator();
const signUp = new SignUpUseCase(repository, hash, token);
const signIn = new SignInUseCase(repository, hash, token);
const userController = new UserController(signUp, signIn);
const middleware = new AuthMiddleware(token);

UserRoutes.post("/signup", (req: Request, res: Response) => {
  userController.signup(req, res);
});

UserRoutes.post("/signin", (req: Request, res: Response) => {
  userController.signin(req, res);
});

UserRoutes.get("/me", middleware.handle, (req: Request, res: Response) => {
  res.json(req.user);
});
