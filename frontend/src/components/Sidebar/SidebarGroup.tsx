import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router";
import type { LucideIcon } from "lucide-react";

type SidebarItem = {
  path: string;
  label: string;
  icon: LucideIcon;
};

type SidebarGroupProps = {
  label: string;
  items: SidebarItem[];
  onNavigate?: () => void;
};

const SidebarGroup = ({ label, items, onNavigate }: SidebarGroupProps) => {
  const location = useLocation();
  const hasActiveItem = items.some((item) => item.path === location.pathname);
  const [manuallyOpen, setManuallyOpen] = useState(hasActiveItem);
  const isOpen = manuallyOpen;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setManuallyOpen((prev) => !prev)}
        className="w-full flex items-center justify-between py-2 px-2 rounded-md cursor-pointer hover:bg-surface-muted"
        aria-expanded={isOpen}
      >
        <span className="text-xs text-text-primary font-bold tracking-wide uppercase">
          {label}
        </span>
        <ChevronDown
          size={16}
          className={`text-text-muted transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-1 pt-2 pb-2">
            {items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onNavigate}
                  className={`group relative flex items-center gap-3 py-2 px-2 rounded-md cursor-pointer ${
                    isActive
                      ? "bg-primary-100 text-primary-500"
                      : "hover:bg-surface-muted text-text-secondary"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full ${
                      isActive ? "bg-primary-500" : "bg-transparent"
                    }`}
                  />
                  <div
                    className={`p-2 rounded-md shrink-0 ${
                      isActive ? "bg-primary-500" : ""
                    }`}
                  >
                    <item.icon
                      size={18}
                      className={isActive ? "text-white" : "text-text-secondary"}
                    />
                  </div>
                  <p className="text-sm">{item.label}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarGroup;
