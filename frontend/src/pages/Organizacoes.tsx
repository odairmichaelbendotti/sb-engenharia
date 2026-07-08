import { useEffect, useState } from "react";
import { Building2, Loader2, Search } from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import { useTenants } from "../store/tenants";
import TenantTable from "./Tenant/TenantTable";

export default function Organizacoes() {
  const { tenants, listTenants } = useTenants();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <Breadcrumb current="Organizações" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Building2 size={20} className="text-primary-500" />
            Organizações
          </h1>
          <p className="text-text-secondary text-xs mt-0.5">
            Organizações cadastradas na plataforma
          </p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 pt-3 pb-2 border-b border-border">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              placeholder="Buscar por nome, apelido, CNPJ ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
            />
          </div>
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
    </div>
  );
}
