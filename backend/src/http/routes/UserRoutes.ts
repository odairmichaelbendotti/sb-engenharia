import { Router, type Response, type Request } from "express";
import { UserController } from "../controllers/UserController.js";
import { SignUpUseCase } from "../../application/usecases/user/SignUpUseCase.js";
import { PrismaUserRepository } from "../../infrastructure/database/prisma/PrismaUserRepository.js";
import { HashGenerator } from "../../infrastructure/cryptography/HashGenerator.js";
import { SignInUseCase } from "../../application/usecases/user/SignInUseCase.js";
import { TokenGenerator } from "../../infrastructure/cryptography/TokenGenerator.js";
import { AuthMiddleware } from "../middleware/AuthMiddleware.js";
import { PrismaTenantRepository } from "../../infrastructure/database/prisma/PrismaTenantRepository.js";
import { ListUnapprovedUsersUseCase } from "../../application/usecases/user/ListUnapprovedUsersUseCase.js";
import { ApproveUserUseCase } from "../../application/usecases/user/ApproveUserUseCase.js";
import { DisapproveUserUseCase } from "../../application/usecases/user/DisapproveUserUseCase.js";

export const UserRoutes = Router();

const repository = new PrismaUserRepository();
const hash = new HashGenerator();
const token = new TokenGenerator();
const tenantRepository = new PrismaTenantRepository();
const unapprovedUsers = new ListUnapprovedUsersUseCase(repository);
const approveUser = new ApproveUserUseCase(repository);
const disaproveUser = new DisapproveUserUseCase(repository);

const signUp = new SignUpUseCase(repository, hash, token, tenantRepository);
const signIn = new SignInUseCase(repository, hash, token);
const userController = new UserController(
  signUp,
  signIn,
  unapprovedUsers,
  approveUser,
  disaproveUser,
);
const middleware = new AuthMiddleware(token, repository);

UserRoutes.post("/signup", (req: Request, res: Response) => {
  userController.signup(req, res);
});

UserRoutes.post("/signin", (req: Request, res: Response) => {
  userController.signin(req, res);
});

UserRoutes.post("/logout", (req: Request, res: Response) => {
  userController.logout(req, res);
});

UserRoutes.get("/me", middleware.handle, (req: Request, res: Response) => {
  res.json(req.user);
});

UserRoutes.get(
  "/list-unapproved-users",
  middleware.handle,
  (req: Request, res: Response) => {
    userController.listUnapprovedUsers(req, res);
  },
);

UserRoutes.put(
  "/user/:id/approve",
  middleware.handle,
  (req: Request, res: Response) => {
    userController.approve(req, res);
  },
);

UserRoutes.delete(
  "/user/:id/disapprove",
  middleware.handle,
  (req: Request, res: Response) => {
    userController.disapprove(req, res);
  },
);
