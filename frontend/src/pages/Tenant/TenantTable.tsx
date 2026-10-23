import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Building2, Eye, Mail, Phone } from "lucide-react";
import { ActionMenu, CodeTag, Pagination, Table, TableBody, TableHead, Td, Th, Tr } from "../../components/ui";
import type { Tenant } from "../../../types/tenant";
import { formatDate } from "../../utils/format-currency";
import { maskCnpj, maskPhone, onlyDigits } from "../../utils/masks";

const ITEMS_PER_PAGE = 10;

type TenantTableProps = {
  tenants: Tenant[];
  searchTerm: string;
};

const TenantTable = ({ tenants, searchTerm }: TenantTableProps) => {
  const navigate = useNavigate();
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

  const totalPages = Math.max(1, Math.ceil(filteredTenants.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedTenants = filteredTenants.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // A organização abre no resumo dela (tela própria, com os números da unidade)
  const view = (tenant: Tenant) => navigate(`/organizacoes/${tenant.id}`);

  return (
    <div>
      <Table>
        <TableHead>
          <Th>Organização</Th>
          <Th width="w-44" className="hidden lg:table-cell">
            Localização
          </Th>
          <Th width="w-64" className="hidden xl:table-cell">
            Contato
          </Th>
          <Th width="w-36" className="hidden md:table-cell">
            Cadastrada em
          </Th>
          <Th actions />
        </TableHead>
        <TableBody>
          {paginatedTenants.map((tenant) => (
            <Tr key={tenant.id} onOpen={() => view(tenant)}>
              <Td>
                <p className="font-semibold text-text-primary truncate" title={tenant.name}>
                  {tenant.name}
                </p>
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-1 text-[11px] text-text-muted">
                  <CodeTag>{maskCnpj(tenant.cnpj)}</CodeTag>
                  <span>{tenant.apelido}</span>
                </div>
              </Td>
              <Td className="hidden lg:table-cell">
                <span className="text-text-primary">
                  {tenant.city}/{tenant.state}
                </span>
              </Td>
              <Td className="hidden xl:table-cell">
                <p className="flex items-center justify-center gap-1 text-text-primary truncate" title={tenant.email}>
                  <Mail size={12} className="text-text-muted shrink-0" />
                  <span className="truncate">{tenant.email}</span>
                </p>
                <p className="flex items-center justify-center gap-1 text-[11px] text-text-muted">
                  <Phone size={11} className="shrink-0" />
                  {maskPhone(tenant.phone)}
                </p>
              </Td>
              <Td className="hidden md:table-cell">
                <span className="text-text-secondary">{formatDate(tenant.createdAt)}</span>
              </Td>
              <Td actions>
                <ActionMenu
                  label={`Ações da organização ${tenant.name}`}
                  items={[{ label: "Visualizar", icon: Eye, onClick: () => view(tenant) }]}
                />
              </Td>
            </Tr>
          ))}
        </TableBody>
      </Table>

      {paginatedTenants.length === 0 && (
        <div className="py-10 text-center">
          <Building2 size={28} className="mx-auto text-text-muted mb-2" />
          <p className="text-sm text-text-secondary font-medium">Nenhuma organização encontrada</p>
          <p className="text-text-muted text-xs mt-1">Tente ajustar a busca</p>
        </div>
      )}

      <Pagination
        currentPage={page}
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
