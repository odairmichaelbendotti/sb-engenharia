import { Outlet } from "react-router";
import Sidebar from "../Sidebar/Sidebar";

const DashboardLayout = () => {
  return (
    <main className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <Outlet />
    </main>
  );
};

export default DashboardLayout;
