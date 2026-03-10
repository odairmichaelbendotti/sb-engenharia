import type { SignInUseCase } from "../../application/usecases/SignInUseCase.js";
import { SignUpUseCase } from "../../application/usecases/SingnUpUseCase.js";
import { DomainError } from "../../domain/errors/DomainError.js";
import { type Request, type Response } from "express";

export class UserController {
  constructor(
    private signUpUseCase: SignUpUseCase,
    private signInUseCase: SignInUseCase,
  ) {}

  async signup(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;

      const result = await this.signUpUseCase.execute(name, email, password);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof DomainError) {
        return res.status(409).json({ message: err.message });
      }
    }
  }
  async signin(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
      const result = await this.signInUseCase.execute({ email, password });
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof DomainError) {
        return res.status(409).json(err.message);
      }
    }
  }
}
