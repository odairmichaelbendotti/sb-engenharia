import { Outlet } from "react-router";
import Sidebar from "../Sidebar/Sidebar";
import MobileSidebar from "../Sidebar/MobileSidebar";
import { useEffect } from "react";
import { useUser } from "../../store/user";

const MobileDashboardLayout = () => {
  const { fetchUser } = useUser();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

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

export default MobileDashboardLayout;
