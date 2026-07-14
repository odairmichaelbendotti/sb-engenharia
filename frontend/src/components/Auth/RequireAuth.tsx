import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { useUser } from "../../store/user";
import PendingApproval from "../../pages/auth/PendingApproval/page";

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user, fetchUser } = useUser();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchUser()
      .catch(() => {
        if (!cancelled) navigate("/signin");
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchUser, navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!user.approved) {
    return <PendingApproval />;
  }

  return <>{children}</>;
};

export default RequireAuth;
