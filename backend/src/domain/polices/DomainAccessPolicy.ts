import type { UserRole } from "../../generated/prisma/enums.js";

export type BusinessDomain = "engenharia" | "administrativo";
type AccessLevel = "none" | "view" | "edit";

const ROLE_DOMAIN_ACCESS: Record<UserRole, Record<BusinessDomain, AccessLevel>> = {
  USER: { engenharia: "view", administrativo: "view" },
  ENGENHARIA: { engenharia: "edit", administrativo: "none" },
  ADMINISTRATIVO: { engenharia: "none", administrativo: "edit" },
  COORDENACAO: { engenharia: "edit", administrativo: "edit" },
  MASTER: { engenharia: "edit", administrativo: "edit" },
  PLATFORM_ADMIN: { engenharia: "edit", administrativo: "edit" },
};

export class DomainAccessPolicy {
  can(role: UserRole, domain: BusinessDomain, action: "view" | "edit") {
    const level = ROLE_DOMAIN_ACCESS[role][domain];
    if (action === "view") return level === "view" || level === "edit";
    return level === "edit";
  }
}
