import { CreateUserUseCase } from "../../application/usecases/CreateUserUseCase.js";
import { DomainError } from "../../domain/errors/DomainError.js";
import { PrismaUserRepository } from "../../infrastructure/database/prisma/PrismaUserRepository.js";
import { type Request, type Response } from "express";

export class UserController {
  constructor(private createUserUseCase: CreateUserUseCase) {}

  async createUser(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;

      const result = await this.createUserUseCase.execute(
        name,
        email,
        password,
      );
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof DomainError) {
        return res.status(409).json({ message: err.message });
      }
    }
  }
}
