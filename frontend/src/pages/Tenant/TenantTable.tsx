import { useMemo, useState } from "react";
import { Building2, Mail, MapPin, Phone } from "lucide-react";
import { Pagination, Table, TableBody, TableHead, Td, Th, Tr } from "../../components/ui";
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
      <Table>
        <TableHead>
          <Th wrap>Organização</Th>
          <Th className="hidden md:table-cell">CNPJ</Th>
          <Th className="hidden lg:table-cell">Localização</Th>
          <Th className="hidden sm:table-cell">Contato</Th>
          <Th className="hidden md:table-cell">Cadastrado em</Th>
        </TableHead>
        <TableBody>
          {paginatedTenants.map((tenant) => (
            <Tr key={tenant.id}>
              {/* Nome da organização quebra linha: até duas linhas, completo ao passar o mouse */}
              <Td wrap>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-surface-muted border border-border rounded-lg flex items-center justify-center shrink-0">
                    <Building2 size={16} className="text-text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary line-clamp-2" title={tenant.name}>
                      {tenant.name}
                    </p>
                    <p className="text-xs text-text-secondary">{tenant.apelido}</p>
                  </div>
                </div>
              </Td>
              <Td className="hidden md:table-cell">
                <span className="text-text-secondary">{maskCnpj(tenant.cnpj)}</span>
              </Td>
              <Td className="hidden lg:table-cell">
                <div className="flex items-center gap-1 text-text-secondary">
                  <MapPin size={14} />
                  <span>
                    {tenant.city}, {tenant.state}
                  </span>
                </div>
              </Td>
              <Td className="hidden sm:table-cell">
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
              </Td>
              <Td className="hidden md:table-cell">
                <span className="text-text-secondary">{formatDate(tenant.createdAt)}</span>
              </Td>
            </Tr>
          ))}
        </TableBody>
      </Table>

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
