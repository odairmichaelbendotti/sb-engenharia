import { CreateUserUseCase } from "../../application/usecases/CreateUserUseCase.js";
import { PrismaUserRepository } from "../../infrastructure/database/prisma/PrismaUserRepository.js";
import { type Request, type Response } from "express";

export class UserController {
  constructor(private createUserUseCase: CreateUserUseCase) {}

  async createUser(req: Request, res: Response) {
    const { name, email, password } = req.body;

    const result = await this.createUserUseCase.execute(name, email, password);
    res.status(201).json(result);
  }
}
