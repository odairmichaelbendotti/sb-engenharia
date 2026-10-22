import { useMemo, useState } from "react";
import { Building2, Mail, MapPin, Phone } from "lucide-react";
import { Pagination } from "../../components/ui";
import type { Tenant } from "../../../types/tenant";
import { formatDate } from "../../utils/format-currency";
import { maskCnpj, maskPhone, onlyDigits } from "../../utils/masks";

const ITEMS_PER_PAGE = 10;

type TenantTableProps = {
  tenants: Tenant[];
  searchTerm: string;
};

const TenantTable = ({ tenants, searchTerm }: TenantTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTenants = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const digits = onlyDigits(searchTerm);
    return tenants.filter(
      (tenant) =>
        tenant.name.toLowerCase().includes(term) ||
        tenant.apelido.toLowerCase().includes(term) ||
        (digits !== "" && tenant.cnpj.includes(digits)) ||
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
        <table className="w-full text-table">
          <thead className="bg-surface-muted border-b border-border">
            <tr>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Organização
              </th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wide hidden md:table-cell">
                CNPJ
              </th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wide hidden lg:table-cell">
                Localização
              </th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wide hidden sm:table-cell">
                Contato
              </th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wide hidden md:table-cell">
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
                    <div className="w-9 h-9 bg-surface-muted border border-border rounded-lg flex items-center justify-center shrink-0">
                      <Building2 size={16} className="text-text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary text-table">
                        {tenant.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {tenant.apelido}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-table text-text-secondary hidden md:table-cell">
                  {maskCnpj(tenant.cnpj)}
                </td>
                <td className="py-3 px-4 hidden lg:table-cell">
                  <div className="flex items-center gap-1 text-table text-text-secondary">
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
                      {maskPhone(tenant.phone)}
                    </p>
                    <p className="flex items-center gap-1 text-xs mt-1">
                      <Mail size={12} />
                      {tenant.email}
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4 text-table text-text-secondary hidden md:table-cell">
                  {formatDate(tenant.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {paginatedTenants.length === 0 && (
        <div className="py-8 text-center">
          <Building2 size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-sm text-text-secondary font-medium">
            Nenhuma organização encontrada
          </p>
          <p className="text-text-muted text-sm mt-1">
            Tente ajustar os filtros de busca
          </p>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        totalItems={filteredTenants.length}
        itemsPerPage={ITEMS_PER_PAGE}
        itemLabel="organizações"
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default TenantTable;
