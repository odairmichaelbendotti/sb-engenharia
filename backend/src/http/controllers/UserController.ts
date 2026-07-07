import type { SignInUseCase } from "../../application/usecases/user/SignInUseCase.js";
import { SignUpUseCase } from "../../application/usecases/user/SignUpUseCase.js";
import { DomainError } from "../../domain/errors/DomainError.js";
import { type Request, type Response } from "express";

export class UserController {
  constructor(
    private signUpUseCase: SignUpUseCase,
    private signInUseCase: SignInUseCase,
  ) {}

  async signup(req: Request, res: Response) {
    try {
      const { name, email, approved, password, tenant_id } = req.body;

      const { token, createdUser: user } = await this.signUpUseCase.execute({
        name,
        tenant_id,
        email,
        password,
        approved,
      });

      const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        approved: user.approved,
        role: user.role,
      };

      res.cookie("auth", token);
      res.status(201).json(userResponse);
    } catch (err) {
      if (err instanceof DomainError) {
        return res.status(409).json({ message: err.message });
      }
      console.log(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
  async signin(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
      const { token, user } = await this.signInUseCase.execute({
        email,
        password,
      });

      res.cookie("auth", token);
      res.status(200).json(user);
    } catch (err) {
      console.log(err);
      if (err instanceof DomainError) {
        return res.status(409).json({ message: err.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
  logout(req: Request, res: Response) {
    res.clearCookie("auth");
    res.status(200).json({ message: "Logout successful" });
  }
}
