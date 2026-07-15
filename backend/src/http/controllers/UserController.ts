import type { ApproveUserUseCase } from "../../application/usecases/user/ApproveUserUseCase.js";
import type { DisapproveUserUseCase } from "../../application/usecases/user/DisapproveUserUseCase.js";
import type { ListUnapprovedUsersUseCase } from "../../application/usecases/user/ListUnapprovedUsersUseCase.js";
import type { SignInUseCase } from "../../application/usecases/user/SignInUseCase.js";
import { SignUpUseCase } from "../../application/usecases/user/SignUpUseCase.js";
import { DomainError } from "../../domain/errors/DomainError.js";
import { type Request, type Response } from "express";
import type { User } from "../../generated/prisma/client.js";
import type { ListUsersUseCase } from "../../application/usecases/user/ListUsersUseCase.js";
import type { UpdateUserRoleUseCase } from "../../application/usecases/user/UpdateUserRoleUseCase.js";

const VALID_ROLES = ["USER", "EDITOR", "MASTER", "PLATFORM_ADMIN"];

export class UserController {
  constructor(
    private signUpUseCase: SignUpUseCase,
    private signInUseCase: SignInUseCase,
    private listUnapproved: ListUnapprovedUsersUseCase,
    private approveUser: ApproveUserUseCase,
    private disaproveUser: DisapproveUserUseCase,
    private listUserUseCase: ListUsersUseCase,
    private updateUserRole: UpdateUserRoleUseCase,
  ) {}

  async signup(req: Request, res: Response) {
    try {
      const { name, email, password, tenant_id } = req.body;

      const { token, createdUser: user } = await this.signUpUseCase.execute({
        name,
        tenant_id,
        email,
        password,
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
  async list(req: Request, res: Response) {
    const { page } = req.query;
    const { user } = req;

    if (!page) {
      return res.status(403).json({ message: "parameter not found" });
    }

    if (user.role === "MASTER") {
      const users = await this.listUserUseCase.execute({
        tenant_id: user.tenant_id,
        page: Number(page),
      });
      return res.status(200).json(users);
    }

    if (user.role === "PLATFORM_ADMIN") {
      const users = await this.listUserUseCase.execute({
        tenant_id: undefined,
        page: Number(page),
      });
      return res.status(200).json(users);
    }

    return res.status(403).json({ message: "Unauthorized" });
  }
  async updateRole(req: Request, res: Response) {
    const { user } = req;
    const { id } = req.params;
    const { role } = req.body;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: "Invalid user" });
    }

    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    try {
      const updatedUser = await this.updateUserRole.execute({
        userId: id,
        role,
        user,
      });
      return res.status(200).json(updatedUser);
    } catch (err) {
      if (err instanceof DomainError) {
        return res.status(403).json({ message: err.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
