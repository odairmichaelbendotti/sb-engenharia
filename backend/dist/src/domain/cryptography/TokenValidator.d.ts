import { type JwtPayload } from "jsonwebtoken";
export interface ITokenValidator {
    validate(token: string): JwtPayload | string;
}
//# sourceMappingURL=TokenValidator.d.ts.map