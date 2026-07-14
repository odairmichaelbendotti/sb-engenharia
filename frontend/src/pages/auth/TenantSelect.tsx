import { useEffect, useRef, useState } from "react";
import { Building2, ChevronDown } from "lucide-react";
import type { TenantOption } from "../../../types/tenant";

type TenantSelectProps = {
  tenants: TenantOption[];
  value: string;
  onChange: (tenantId: string) => void;
  placeholder?: string;
};

const TenantSelect = ({
  tenants,
  value,
  onChange,
  placeholder = "Selecione sua organização",
}: TenantSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedTenant = tenants.find((tenant) => tenant.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center gap-3 px-4 py-2.5 border border-border rounded-lg bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition cursor-pointer"
        aria-expanded={isOpen}
      >
        <Building2 size={18} className="text-text-muted shrink-0" />
        <span
          className={`flex-1 text-left text-sm truncate ${
            selectedTenant ? "text-text-primary" : "text-text-muted"
          }`}
        >
          {selectedTenant ? selectedTenant.name : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-text-muted shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-surface border border-border rounded-lg shadow-md py-1">
          {tenants.length === 0 && (
            <p className="px-4 py-2 text-sm text-text-muted">
              Nenhuma organização disponível
            </p>
          )}
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              type="button"
              onClick={() => {
                onChange(tenant.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                tenant.id === value
                  ? "bg-primary-100 text-primary-600 font-medium"
                  : "text-text-primary hover:bg-surface-muted"
              }`}
            >
              {tenant.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TenantSelect;
