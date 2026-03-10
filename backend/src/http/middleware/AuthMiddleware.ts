import type { Request, Response, NextFunction } from "express";
import type { ITokenValidator } from "../../domain/cryptography/TokenValidator.js";

export class AuthMiddleware {
  constructor(private tokenValidator: ITokenValidator) {}

  handle = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.auth;

    if (!token) return res.status(401).json({ message: "Token not provided" });

    const payload = this.tokenValidator.validate(token);

    if (!payload) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = payload;
    next();
  };
}
