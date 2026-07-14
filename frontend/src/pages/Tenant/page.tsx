import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTenants } from "../../store/tenants";
import { usePermission } from "../../hooks/usePermission";
import TenantTable from "./TenantTable";
import RegisterTenant from "./RegisterTenant";
import TenantHeader from "./TenantHeader";
import TenantFilters from "./TenantFilters";
import type { CreateTenantType } from "../../../types/create-tenant";

const emptyFormData: CreateTenantType = {
  name: "",
  apelido: "",
  cnpj: "",
  cep: "",
  city: "",
  state: "",
  address: "",
  phone: "",
  email: "",
};

export default function Organizacoes() {
  const { tenants, listTenants } = useTenants();
  const { canManageOrganization } = usePermission();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<CreateTenantType>(emptyFormData);

  useEffect(() => {
    const loadTenants = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await listTenants();
      } catch {
        setError("Erro ao carregar organizações. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    };
    loadTenants();
  }, [listTenants]);

  const handleOpen = () => {
    setFormData(emptyFormData);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setFormData(emptyFormData);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <TenantHeader
        canManageOrganization={canManageOrganization}
        onAdd={handleOpen}
      />

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 pt-3 pb-2 border-b border-border">
          <TenantFilters searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        </div>

        {isLoading && (
          <div className="py-12 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-primary-500" />
          </div>
        )}

        {!isLoading && error && (
          <div className="py-12 text-center">
            <p className="text-danger-text font-medium">{error}</p>
            <button
              onClick={() => listTenants()}
              className="mt-3 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors text-sm font-medium"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <TenantTable tenants={tenants} searchTerm={searchTerm} />
        )}
      </div>

      {isOpen && (
        <RegisterTenant
          isOpen={isOpen}
          handleClose={handleClose}
          formData={formData}
          setFormData={setFormData}
        />
      )}
    </div>
  );
}
