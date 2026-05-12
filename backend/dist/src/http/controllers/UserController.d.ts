import type { SignInUseCase } from "../../application/usecases/user/SignInUseCase.js";
import { SignUpUseCase } from "../../application/usecases/user/SingnUpUseCase.js";
import { type Request, type Response } from "express";
export declare class UserController {
    private signUpUseCase;
    private signInUseCase;
    constructor(signUpUseCase: SignUpUseCase, signInUseCase: SignInUseCase);
    signup(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    signin(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    logout(req: Request, res: Response): void;
}
//# sourceMappingURL=UserController.d.ts.map