export interface User {
  id: string;
  name: string;
  email: string;
  role:
    | "USER"
    | "ENGENHARIA"
    | "ADMINISTRATIVO"
    | "COORDENACAO"
    | "MASTER"
    | "PLATFORM_ADMIN"
    | "EMPRESA";
  approved: boolean;
  tenant_id: string;
  company_id: string | null;
}

export interface UnapprovedUser extends User {
  tenant: {
    name: string;
  };
}
