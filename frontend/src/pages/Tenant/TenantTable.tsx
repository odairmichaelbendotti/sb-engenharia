import { useMemo, useState } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import type { Tenant } from "../../../types/tenant";
import { formatDate } from "../../utils/format-currency";

const ITEMS_PER_PAGE = 10;

type TenantTableProps = {
  tenants: Tenant[];
  searchTerm: string;
};

const TenantTable = ({ tenants, searchTerm }: TenantTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTenants = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return tenants.filter(
      (tenant) =>
        tenant.name.toLowerCase().includes(term) ||
        tenant.apelido.toLowerCase().includes(term) ||
        tenant.cnpj.includes(searchTerm) ||
        tenant.city.toLowerCase().includes(term),
    );
  }, [tenants, searchTerm]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const totalPages = Math.ceil(filteredTenants.length / ITEMS_PER_PAGE);
  const paginatedTenants = filteredTenants.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-muted border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Organização
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden md:table-cell">
                CNPJ
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden lg:table-cell">
                Localização
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden sm:table-cell">
                Contato
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden md:table-cell">
                Cadastrado em
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedTenants.map((tenant) => (
              <tr
                key={tenant.id}
                className="hover:bg-surface-muted/50 transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                      <Building2 size={18} className="text-primary-500" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary text-sm">
                        {tenant.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {tenant.apelido}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-text-secondary hidden md:table-cell">
                  {tenant.cnpj}
                </td>
                <td className="py-3 px-4 hidden lg:table-cell">
                  <div className="flex items-center gap-1 text-sm text-text-secondary">
                    <MapPin size={14} />
                    <span>
                      {tenant.city}, {tenant.state}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 hidden sm:table-cell">
                  <div className="text-xs text-text-secondary">
                    <p className="flex items-center gap-1">
                      <Phone size={12} />
                      {tenant.phone}
                    </p>
                    <p className="flex items-center gap-1 text-xs mt-1">
                      <Mail size={12} />
                      {tenant.email}
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-text-secondary hidden md:table-cell">
                  {formatDate(tenant.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {paginatedTenants.length === 0 && (
        <div className="py-12 text-center">
          <Building2 size={48} className="mx-auto text-text-muted mb-4" />
          <p className="text-text-secondary font-medium">
            Nenhuma organização encontrada
          </p>
          <p className="text-text-muted text-sm mt-1">
            Tente ajustar os filtros de busca
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-muted">
          <p className="text-sm text-text-secondary">
            Mostrando {startIndex + 1} a{" "}
            {Math.min(startIndex + ITEMS_PER_PAGE, filteredTenants.length)} de{" "}
            {filteredTenants.length} organizações
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 hover:bg-surface cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-text-secondary">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-surface cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantTable;
