import type { NextFunction, Request, Response } from "express";
import {
  DomainAccessPolicy,
  type Capability,
} from "../../domain/polices/DomainAccessPolicy.js";

// Libera a rota por ação pontual da policy, em vez do nível de acesso do domínio
export class RequireCapability {
  private policy = new DomainAccessPolicy();

  handle(capability: Capability) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.policy.canDo(req.user.role, capability)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    };
  }
}
