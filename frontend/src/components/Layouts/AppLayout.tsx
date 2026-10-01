import { Navigate, Outlet, useLocation } from "react-router";
import Sidebar from "../Sidebar/Sidebar";
import MobileSidebar from "../Sidebar/MobileSidebar";
import { useUser } from "../../store/user";
import { EMPRESA_PATHS } from "../Sidebar/empresa-items";

const EMPRESA_HOME = "/mapa-obras";

const AppLayout = () => {
  const { user } = useUser();
  const location = useLocation();

  // Empresa só acessa as telas do próprio menu (somente leitura); o resto volta ao mapa
  if (user?.role === "EMPRESA" && !EMPRESA_PATHS.includes(location.pathname)) {
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
