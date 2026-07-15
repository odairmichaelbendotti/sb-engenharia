interface JwtPayload {
  id: string;
  name: string;
  email: string;
  role: "PLATFORM_ADMIN" | "MASTER" | "COORDENACAO" | "ENGENHARIA" | "ADMINISTRATIVO" | "USER";
}

declare namespace Express {
  interface Request {
    user?: AuthenticatedUser;
  }
}
