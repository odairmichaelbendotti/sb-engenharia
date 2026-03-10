interface JwtPayload {
  id: string;
  email: string;
}

declare namespace Express {
  interface Request {
    user?: JwtPayload;
  }
}
