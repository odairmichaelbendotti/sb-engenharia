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
    | "PLATFORM_ADMIN";
  approved: boolean;
  tenant_id: string;
}

export interface UnapprovedUser extends User {
  tenant: {
    name: string;
  };
}
