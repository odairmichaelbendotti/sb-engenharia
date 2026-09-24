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
  COORDENACAO: { engenharia: "edit", administrativo: "edit" },
  // MASTER e PLATFORM_ADMIN só visualizam Engenharia (Obra) — edição fica
  // restrita a ENGENHARIA/COORDENACAO, por decisão explícita do usuário.
  MASTER: { engenharia: "view", administrativo: "edit" },
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
    canApproveUsers: role === "MASTER" || role === "PLATFORM_ADMIN",
    // Login da empresa contratada — só enxerga o Mapa de Obras, filtrado pela
    // própria empresa. Ver AppLayout.tsx (redireciona qualquer outra rota) e
    // Sidebar/MobileSidebar (só mostram o item Mapa de Obras).
    isEmpresaRestricted: role === "EMPRESA",
  };
}
