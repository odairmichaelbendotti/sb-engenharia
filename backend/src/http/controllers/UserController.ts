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

      const { token, user } = await this.signUpUseCase.execute(
        name,
        email,
        password,
      );

      res.cookie("auth", token);
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof DomainError) {
        return res.status(409).json({ message: err.message });
      }
    }
  }
  async signin(req: Request, res: Response) {
    const { email, password } = req.body;
    console.log("etapa 1");
    try {
      const { token, user } = await this.signInUseCase.execute({
        email,
        password,
      });

      console.log("etapa 2");

      res.cookie("auth", token);
      console.log("etapa 3");
      res.status(200).json(user);
    } catch (err) {
      console.log(err);
      if (err instanceof DomainError) {
        return res.status(409).json(err.message);
      }
    }
  }
}
