export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: "PLATFORM_ADMIN" | "MASTER" | "EDITOR" | "USER";
  approved: boolean;
}
