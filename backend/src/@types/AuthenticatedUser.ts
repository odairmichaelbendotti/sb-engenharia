export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: "PLATFORM_ADMIN" | "MASTER" | "COORDENACAO" | "ENGENHARIA" | "ADMINISTRATIVO" | "USER" | "EMPRESA";
  approved: boolean;
  tenant_id: string;
  company_id: string | null;
}
