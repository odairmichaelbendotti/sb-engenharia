import type { Request, Response, NextFunction } from "express";
import type { ITokenValidator } from "../../domain/cryptography/TokenValidator.js";
export declare class AuthMiddleware {
    private tokenValidator;
    constructor(tokenValidator: ITokenValidator);
    handle: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
}
//# sourceMappingURL=AuthMiddleware.d.ts.map