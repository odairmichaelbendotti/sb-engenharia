import { SquareDashedMousePointer, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { aminItems } from "./adm-items";
import { engItems } from "./eng-items";
import { useUser } from "../../store/user";
import { getInitials } from "../../utils/get-initial";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  function isActive(path: string) {
    return location.pathname === path;
  }

  function changeClass(path: string) {
    return isActive(path)
      ? "group flex items-center gap-3 bg-primary-100 text-primary-500 py-2 px-2 rounded-md cursor-pointer"
      : "group flex items-center gap-3 hover:bg-surface-muted text-text-secondary py-2 px-2 rounded-md cursor-pointer";
  }

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
    <div className="hidden md:flex max-w-64 w-full p-4 border-r border-border h-full">
      {/* Principal */}
      <div className="w-full flex flex-col">
        {/* Logo section */}
        <div className="flex items-center gap-3">
          <SquareDashedMousePointer />
          <p className="font-bold text-text-primary">Gestão</p>
        </div>

        {/* Content section */}
        <div className="flex flex-col h-full">
          <p className="mt-8 text-xs text-text-primary font-bold">
            Administrativo
          </p>
          <div className="flex-1">
            {aminItems.map((item) => (
              <Link to={item.path} className={changeClass(item.path)}>
                <div
                  className={`p-2 rounded-md ${location.pathname === item.path ? "bg-primary-500" : ""}`}
                >
                  <item.icon
                    size={18}
                    color={location.pathname === item.path ? "white" : "gray"}
                  />
                </div>
                <p className="text-sm">{item.label}</p>
              </Link>
            ))}

            <p className="mt-8 text-xs text-text-primary font-bold">
              Engenharia
            </p>
            <div>
              {engItems.map((item) => (
                <Link to={item.path} className={changeClass(item.path)}>
                  <div
                    className={`p-2 rounded-md ${location.pathname === item.path ? "bg-primary-500" : ""}`}
                  >
                    <item.icon
                      size={18}
                      color={location.pathname === item.path ? "white" : "gray"}
                    />
                  </div>
                  <p className="text-sm">{item.label}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Footer here */}
          <div className="border-t border-border flex items-center justify-between pt-3 gap-3">
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
    </div>
  );
};

export default Sidebar;
