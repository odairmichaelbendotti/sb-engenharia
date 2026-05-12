import jwt from "jsonwebtoken";
import { DomainError } from "../../domain/errors/DomainError.js";
export class TokenGenerator {
    secret;
    constructor() {
        const secret = process.env.JWT_SECRET;
        if (!secret)
            throw new DomainError("JWT_SECRET is not defined");
        this.secret = secret;
    }
    generate(payload) {
        return jwt.sign(payload, this.secret, {
            expiresIn: "30d",
        });
    }
    validate(token) {
        try {
            return jwt.verify(token, this.secret);
        }
        catch (err) {
            throw new DomainError("Invalid credentials");
        }
    }
}
//# sourceMappingURL=TokenGenerator.js.map