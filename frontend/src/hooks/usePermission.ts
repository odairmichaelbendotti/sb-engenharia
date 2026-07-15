import { useUser } from "../store/user";
import type { User } from "../../types/user";

type AccessLevel = "none" | "view" | "edit";

const ROLE_DOMAIN_ACCESS: Record<
  User["role"],
  { engenharia: AccessLevel; administrativo: AccessLevel }
> = {
  USER: { engenharia: "view", administrativo: "view" },
  ENGENHARIA: { engenharia: "edit", administrativo: "none" },
  ADMINISTRATIVO: { engenharia: "none", administrativo: "edit" },
  COORDENACAO: { engenharia: "edit", administrativo: "edit" },
  MASTER: { engenharia: "edit", administrativo: "edit" },
  PLATFORM_ADMIN: { engenharia: "edit", administrativo: "edit" },
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
  };
}
