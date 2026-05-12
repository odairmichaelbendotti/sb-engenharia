import jwt from "jsonwebtoken";
import type { ITokenGenerator } from "../../domain/cryptography/TokenGenerator.js";
import type { ITokenValidator } from "../../domain/cryptography/TokenValidator.js";
export declare class TokenGenerator implements ITokenGenerator, ITokenValidator {
    private readonly secret;
    constructor();
    generate(payload: object): string;
    validate(token: string): jwt.JwtPayload | string;
}
//# sourceMappingURL=TokenGenerator.d.ts.map