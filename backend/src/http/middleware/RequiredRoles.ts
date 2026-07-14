import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../../generated/prisma/enums.js";

export class RequiredRoles {
  handle(...allowedRoles: UserRole[]) {
    return function (req: Request, res: Response, next: NextFunction) {
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    };
  }
}

// export function requiredRoles(...allowedRoles: UserRole[]) {
//   return function (req: Request, res: Response, next: NextFunction) {
//     if (!allowedRoles.includes(req.user.role)) {
//       return res.status(403).json({ message: "Forbidden" });
//     }
//     next();
//   };
// }
