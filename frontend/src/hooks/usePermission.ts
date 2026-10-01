import { useUser } from "../store/user";
import type { User } from "../../types/user";

type AccessLevel = "none" | "view" | "edit";

const ROLE_DOMAIN_ACCESS: Record<
  User["role"],
  { engenharia: AccessLevel; administrativo: AccessLevel }
> = {
  USER: { engenharia: "view", administrativo: "view" },
  ENGENHARIA: { engenharia: "edit", administrativo: "view" },
  ADMINISTRATIVO: { engenharia: "view", administrativo: "edit" },
  // COORDENACAO tem os mesmos poderes do MASTER — a diferença é só hierárquica.
  COORDENACAO: { engenharia: "edit", administrativo: "edit" },
  MASTER: { engenharia: "edit", administrativo: "edit" },
  // PLATFORM_ADMIN só visualiza Engenharia (Obra), por decisão explícita do usuário.
  PLATFORM_ADMIN: { engenharia: "view", administrativo: "edit" },
  EMPRESA: { engenharia: "view", administrativo: "none" },
};

export function usePermission() {
  const { user } = useUser();
  const role = user?.role;
  const access = role
    ? ROLE_DOMAIN_ACCESS[role]
    : { engenharia: "none" as const, administrativo: "none" as const };

  return {
    canViewAdministrativo: access.administrativo !== "none",
    canEditAdministrativo: access.administrativo === "edit",
    canViewEngenharia: access.engenharia !== "none",
    canEditEngenharia: access.engenharia === "edit",
    // Alias mantido só para as páginas de Obra/Medições (fora do escopo desta
    // mudança) — mesmo valor de canEditEngenharia, esse domínio ainda não tem
    // backend próprio para diferenciar view/edit de verdade.
    canCreateAndEditContent: access.engenharia === "edit",
    canManageOrganization: role === "PLATFORM_ADMIN",
    // Aprovar/recusar cadastros e mudar roles (espelha a capability manageUsers do backend)
    canApproveUsers:
      role === "MASTER" || role === "COORDENACAO" || role === "PLATFORM_ADMIN",
    // ENGENHARIA só visualiza o administrativo, mas pode abrir OS e criar acesso de empresa
    canCreateOrdemServico: access.administrativo === "edit" || role === "ENGENHARIA",
    canCreateCompanyAccess: access.administrativo === "edit" || role === "ENGENHARIA",
    // Login da empresa contratada — só leitura de Obras, Ordens de Serviço e Mapa
    // de Obras, filtrados pela própria empresa no backend. Ver AppLayout.tsx
    // (redireciona qualquer outra rota) e Sidebar/empresa-items.ts.
    isEmpresaRestricted: role === "EMPRESA",
  };
}
