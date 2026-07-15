import { Navigate } from "react-router";
import { usePermission } from "../../hooks/usePermission";

type RequireRoleProps = {
  allow: (permissions: ReturnType<typeof usePermission>) => boolean;
  children: React.ReactNode;
};

const RequireRole = ({ allow, children }: RequireRoleProps) => {
  const permissions = usePermission();

  if (!allow(permissions)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RequireRole;
