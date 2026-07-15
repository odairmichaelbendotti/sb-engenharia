import type { NextFunction, Request, Response } from "express";
import {
  DomainAccessPolicy,
  type BusinessDomain,
} from "../../domain/polices/DomainAccessPolicy.js";

export class RequireDomainAccess {
  private policy = new DomainAccessPolicy();

  handle(domain: BusinessDomain, action: "view" | "edit") {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.policy.can(req.user.role, domain, action)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    };
  }
}
