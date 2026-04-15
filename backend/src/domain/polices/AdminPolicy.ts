import type { AuthenticatedUser } from "../../@types/AuthenticatedUser";

export class AdminPolicy {
  isAdmin(user: AuthenticatedUser) {
    if (user.role === "USER") {
      return false;
    }
    return true;
  }
}
