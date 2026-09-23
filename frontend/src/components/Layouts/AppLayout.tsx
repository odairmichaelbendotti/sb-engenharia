import { Navigate, Outlet, useLocation } from "react-router";
import Sidebar from "../Sidebar/Sidebar";
import MobileSidebar from "../Sidebar/MobileSidebar";
import { useUser } from "../../store/user";

const EMPRESA_HOME = "/mapa-obras";

const AppLayout = () => {
  const { user } = useUser();
  const location = useLocation();

  if (user?.role === "EMPRESA" && location.pathname !== EMPRESA_HOME) {
    return <Navigate to={EMPRESA_HOME} replace />;
  }

  return (
    <main className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar */}
      <MobileSidebar />

      {/* Main Content - with top padding on mobile for header */}
      <div className="flex-1 h-full overflow-auto md:pt-0 pt-16">
        <Outlet />
      </div>
    </main>
  );
};

export default AppLayout;
