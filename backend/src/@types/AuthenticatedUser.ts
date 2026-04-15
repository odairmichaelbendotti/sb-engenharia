export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: "MASTER" | "EDITOR" | "USER";
}
