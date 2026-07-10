import type { ApproveUserUseCase } from "../../application/usecases/user/ApproveUserUseCase.js";
import type { DisapproveUserUseCase } from "../../application/usecases/user/DisapproveUserUseCase.js";
import type { ListUnapprovedUsersUseCase } from "../../application/usecases/user/ListUnapprovedUsersUseCase.js";
import type { SignInUseCase } from "../../application/usecases/user/SignInUseCase.js";
import { SignUpUseCase } from "../../application/usecases/user/SignUpUseCase.js";
import { DomainError } from "../../domain/errors/DomainError.js";
import { type Request, type Response } from "express";

export class UserController {
  constructor(
    private signUpUseCase: SignUpUseCase,
    private signInUseCase: SignInUseCase,
    private listUnapproved: ListUnapprovedUsersUseCase,
    private approveUser: ApproveUserUseCase,
    private disaproveUser: DisapproveUserUseCase,
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

      res.cookie("auth", token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias, em ms — mesmo prazo do JWT
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });
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

      res.cookie("auth", token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias, em ms — mesmo prazo do JWT
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });
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
  async listUnapprovedUsers(req: Request, res: Response) {
    const { user } = req;
    try {
      const unapprovedUsers = await this.listUnapproved.execute(user.id);
      res.json(unapprovedUsers);
    } catch (err) {
      if (err instanceof DomainError) {
        return res.status(403).json({ message: err.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
  async approve(req: Request, res: Response) {
    const { user } = req;
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      throw new DomainError("All fields are required");
    }

    try {
      const approvedUser = await this.approveUser.execute({ userId: id, user });
      return res.status(200).json(approvedUser);
    } catch (err) {
      if (err instanceof DomainError) {
        return res.status(500).json({ message: err.message });
      }
      return res.status(500).json({ message: "Internal error" });
    }
  }
  async disapprove(req: Request, res: Response) {
    const { user } = req;
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      throw new DomainError("Invalid user");
    }

    try {
      await this.disaproveUser.execute({ userId: id, user });
      return res.status(204).send();
    } catch (err) {
      if (err instanceof DomainError) {
        return res.status(500).json({ message: err.message });
      }
      return res.status(500).json({ message: "Internal error" });
    }
  }
}
