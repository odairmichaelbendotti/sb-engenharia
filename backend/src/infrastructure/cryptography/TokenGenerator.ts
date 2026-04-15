import jwt from "jsonwebtoken";
import { DomainError } from "../../domain/errors/DomainError.js";
import type { ITokenGenerator } from "../../domain/cryptography/TokenGenerator.js";
import type { ITokenValidator } from "../../domain/cryptography/TokenValidator.js";

export class TokenGenerator implements ITokenGenerator, ITokenValidator {
  private readonly secret: string;

  constructor() {
    const secret = process.env.JWT_SECRET;

    if (!secret) throw new DomainError("JWT_SECRET is not defined");
    this.secret = secret;
  }

  generate(payload: object): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: "30d",
    });
  }

  validate(token: string): jwt.JwtPayload | string {
    try {
      return jwt.verify(token, this.secret);
    } catch (err) {
      throw new DomainError("Invalid credentials");
    }
  }
}
