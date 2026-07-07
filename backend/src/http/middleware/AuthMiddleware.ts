import type { Request, Response, NextFunction } from "express";
import type { ITokenValidator } from "../../domain/cryptography/TokenValidator.js";
import type { AuthenticatedUser } from "../../@types/AuthenticatedUser.js";
import type { JwtPayload } from "jsonwebtoken";

export class AuthMiddleware {
  constructor(private tokenValidator: ITokenValidator) {}

  handle = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.auth;

    if (!token) return res.status(401).json({ message: "Token not provided" });

    const payload = this.tokenValidator.validate(token) as JwtPayload;

    if (!payload) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const user: AuthenticatedUser = {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };

    req.user = user;
    next();
  };
}
