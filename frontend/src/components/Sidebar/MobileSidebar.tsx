import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { adminItems } from "./adm-items";
import { engItems } from "./eng-items";
import { gestaoItems } from "./gestao-items";
import { useUser } from "../../store/user";
import { getInitials } from "../../utils/get-initial";
import SidebarGroup from "./SidebarGroup";

const MobileSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useUser();

  function handleLinkClick() {
    setIsOpen(false);
  }

  async function handleLogout() {
    try {
      await logout();
      setIsOpen(false);
      navigate("/signin");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface border-b border-border z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="font-bold text-text-primary text-lg">SB Engenharia</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-surface-muted rounded-md transition-colors"
          aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div
        className={`md:hidden fixed top-0 left-0 bottom-0 w-72 bg-surface z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="font-bold text-text-primary text-lg">SB Engenharia</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-surface-muted rounded-md transition-colors"
              aria-label="Fechar menu"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <SidebarGroup
              label="Gestão"
              items={gestaoItems}
              onNavigate={handleLinkClick}
            />
            <SidebarGroup
              label="Administrativo"
              items={adminItems}
              onNavigate={handleLinkClick}
            />
            <SidebarGroup
              label="Engenharia"
              items={engItems}
              onNavigate={handleLinkClick}
            />
          </div>

          {/* Footer */}
          <div className="border-t border-border pt-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                {getInitials(user?.name || "Usuário")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {user?.name || "Usuário"}
                </p>
                <p className="text-xs text-text-secondary truncate">
                  {user?.email || "email@email.com"}
                </p>
              </div>
              <button
                className="p-2 cursor-pointer hover:bg-surface-muted rounded-md transition-colors shrink-0"
                onClick={handleLogout}
                aria-label="Sair"
              >
                <LogOut size={18} className="text-text-secondary" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;
