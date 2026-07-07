import type { Request, Response, NextFunction } from "express";
import type { ITokenValidator } from "../../domain/cryptography/TokenValidator.js";
import type { AuthenticatedUser } from "../../@types/AuthenticatedUser.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import type { JwtPayload } from "jsonwebtoken";

export class AuthMiddleware {
  constructor(
    private tokenValidator: ITokenValidator,
    private userRepository: IUserRepository,
  ) {}

  handle = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.auth;

    if (!token) return res.status(401).json({ message: "Token not provided" });

    const payload = this.tokenValidator.validate(token) as JwtPayload;

    if (!payload) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const currentUser = await this.userRepository.findById(payload.id);

    if (!currentUser) {
      return res.status(401).json({ message: "User not found" });
    }

    const user: AuthenticatedUser = {
      id: currentUser.id as string,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role as AuthenticatedUser["role"],
      approved: currentUser.approved,
    };

    req.user = user;
    next();
  };
}
