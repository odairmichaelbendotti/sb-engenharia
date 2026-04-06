import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router";
import { aminItems } from "./adm-items";
import { engItems } from "./eng-items";

const MobileSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  function isActive(path: string) {
    return location.pathname === path;
  }

  function changeClass(path: string) {
    return isActive(path)
      ? "group flex items-center gap-3 bg-primary-100 text-primary-500 py-3 px-3 rounded-md cursor-pointer"
      : "group flex items-center gap-3 hover:bg-surface-muted text-text-secondary py-3 px-3 rounded-md cursor-pointer";
  }

  function handleLinkClick() {
    setIsOpen(false);
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface border-b border-border z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="font-bold text-text-primary text-lg">Gestão</span>
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
              <span className="font-bold text-text-primary text-lg">Gestão</span>
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
            <p className="text-xs text-text-primary font-bold mb-3">Administrativo</p>
            <div className="space-y-1">
              {aminItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={changeClass(item.path)}
                  onClick={handleLinkClick}
                >
                  <div
                    className={`p-2 rounded-md ${
                      location.pathname === item.path ? "bg-primary-500" : ""
                    }`}
                  >
                    <item.icon
                      size={20}
                      color={location.pathname === item.path ? "white" : "gray"}
                    />
                  </div>
                  <p className="text-sm font-medium">{item.label}</p>
                </Link>
              ))}
            </div>

            <p className="mt-6 text-xs text-text-primary font-bold mb-3">Engenharia</p>
            <div className="space-y-1">
              {engItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={changeClass(item.path)}
                  onClick={handleLinkClick}
                >
                  <div
                    className={`p-2 rounded-md ${
                      location.pathname === item.path ? "bg-primary-500" : ""
                    }`}
                  >
                    <item.icon
                      size={20}
                      color={location.pathname === item.path ? "white" : "gray"}
                    />
                  </div>
                  <p className="text-sm font-medium">{item.label}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border pt-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                OD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">Odair</p>
                <p className="text-xs text-text-secondary truncate">odair@email.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;
