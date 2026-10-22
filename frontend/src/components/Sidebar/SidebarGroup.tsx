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
        className="w-full flex items-center justify-between h-8 px-3 rounded-lg cursor-pointer hover:bg-surface-muted"
        aria-expanded={isOpen}
      >
        <span className="text-[11px] text-text-muted font-semibold tracking-wider uppercase">
          {label}
        </span>
        <ChevronDown
          size={14}
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
          <div className="flex flex-col gap-0.5 pt-1 pb-2">
            {items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative flex items-center gap-3 h-9 px-3 rounded-lg text-sm cursor-pointer transition-colors ${
                    isActive
                      ? "bg-primary-500 text-white font-semibold"
                      : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                  }`}
                >
                  <item.icon size={16} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
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
