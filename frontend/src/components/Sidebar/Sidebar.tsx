import { SquareDashedMousePointer, LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { adminItems } from "./adm-items";
import { engItems } from "./eng-items";
import { gestaoItems } from "./gestao-items";
import { plataformaItems } from "./plataforma-items";
import { useUser } from "../../store/user";
import { getInitials } from "../../utils/get-initial";
import SidebarGroup from "./SidebarGroup";

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useUser();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/signin");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <div className="hidden md:flex max-w-72 w-full p-5 border-r border-border h-full">
      <div className="w-full flex flex-col">
        {/* Logo section */}
        <div className="flex items-center gap-3">
          <SquareDashedMousePointer size={26} className="text-primary-500 shrink-0" />
          <p className="font-bold text-text-primary text-lg">SB Engenharia</p>
        </div>

        {/* Content section */}
        <div className="flex flex-col h-full mt-8 overflow-y-auto">
          {user?.role === "PLATFORM_ADMIN" && (
            <SidebarGroup label="Plataforma" items={plataformaItems} />
          )}
          {(user?.role === "MASTER" || user?.role === "PLATFORM_ADMIN") && (
            <SidebarGroup label="Gestão" items={gestaoItems} />
          )}
          <SidebarGroup label="Administrativo" items={adminItems} />
          <SidebarGroup label="Engenharia" items={engItems} />
        </div>

        {/* Footer here */}
        <div className="border-t border-border flex items-center justify-between pt-4 mt-4 gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
              {getInitials(user?.name || "Usuário")}
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-semibold text-text-primary truncate">
                {user?.name || "Usuário"}
              </p>
              <p className="text-xs text-text-secondary truncate">
                {user?.email || "email@email.com"}
              </p>
            </div>
          </div>
          <button
            className="p-2 cursor-pointer hover:bg-surface-muted rounded-md transition-colors shrink-0"
            onClick={handleLogout}
          >
            <LogOut size={18} className="text-text-secondary" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
