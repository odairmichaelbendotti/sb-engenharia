export class AuthMiddleware {
    tokenValidator;
    constructor(tokenValidator) {
        this.tokenValidator = tokenValidator;
    }
    handle = (req, res, next) => {
        const token = req.cookies.auth;
        if (!token)
            return res.status(401).json({ message: "Token not provided" });
        const payload = this.tokenValidator.validate(token);
        console.log("Payload here", payload);
        if (!payload) {
            return res.status(401).json({ message: "Invalid token" });
        }
        const user = {
            id: payload.id,
            name: payload.name,
            email: payload.email,
            role: payload.role,
        };
        req.user = user;
        next();
    };
}
// export interface AuthenticatedUser {
//   id: string;
//   name: string;
//   email: string;
//   role: "MASTER" | "EDITOR" | "USER";
// }
//# sourceMappingURL=AuthMiddleware.js.map