export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: "PLATFORM_ADMIN" | "MASTER" | "COORDENACAO" | "ENGENHARIA" | "ADMINISTRATIVO" | "USER";
  approved: boolean;
  tenant_id: string;
}
