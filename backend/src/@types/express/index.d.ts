interface JwtPayload {
  id: string;
  name: string;
  email: string;
  role: "MASTER" | "EDITOR" | "USER";
}

declare namespace Express {
  interface Request {
    user?: JwtPayload;
  }
}
