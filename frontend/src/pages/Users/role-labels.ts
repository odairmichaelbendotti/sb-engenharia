import type { User } from "../../../types/user";

export const ROLE_LABELS: Record<User["role"], string> = {
  PLATFORM_ADMIN: "Admin da Plataforma",
  MASTER: "Master",
  EDITOR: "Editor",
  USER: "Usuário",
};
