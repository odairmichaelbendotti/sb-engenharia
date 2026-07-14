import { useUser } from "../store/user";

export function usePermission() {
  const { user } = useUser();
  const role = user?.role;

  return {
    canCreateAndEditContent:
      role === "EDITOR" || role === "MASTER" || role === "PLATFORM_ADMIN",
    canManageOrganization: role === "PLATFORM_ADMIN",
    canApproveUsers: role === "MASTER" || role === "PLATFORM_ADMIN",
  };
}
