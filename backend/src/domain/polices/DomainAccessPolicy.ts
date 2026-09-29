import type { UserRole } from "../../generated/prisma/enums.js";

export type BusinessDomain = "engenharia" | "administrativo";
type AccessLevel = "none" | "view" | "edit";

// Ações pontuais que não seguem a matriz de domínio (ex.: ENGENHARIA só
// visualiza o administrativo, mas pode abrir uma Ordem de Serviço).
export type Capability = "manageUsers" | "createCompanyAccess" | "createOrdemServico";

const ROLE_DOMAIN_ACCESS: Record<UserRole, Record<BusinessDomain, AccessLevel>> = {
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

const CAPABILITY_ROLES: Record<Capability, readonly UserRole[]> = {
  // Aprovar/recusar cadastros e mudar roles (MASTER/COORDENACAO só na própria organização)
  manageUsers: ["PLATFORM_ADMIN", "MASTER", "COORDENACAO"],
  createCompanyAccess: ["PLATFORM_ADMIN", "MASTER", "COORDENACAO", "ADMINISTRATIVO", "ENGENHARIA"],
  createOrdemServico: ["PLATFORM_ADMIN", "MASTER", "COORDENACAO", "ADMINISTRATIVO", "ENGENHARIA"],
};

export class DomainAccessPolicy {
  can(role: UserRole, domain: BusinessDomain, action: "view" | "edit") {
    const level = ROLE_DOMAIN_ACCESS[role][domain];
    if (action === "view") return level === "view" || level === "edit";
    return level === "edit";
  }

  canDo(role: UserRole, capability: Capability) {
    return CAPABILITY_ROLES[capability].includes(role);
  }
}
