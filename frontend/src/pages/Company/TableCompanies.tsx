import { useMemo, useState } from "react";
import {
  Building2,
  Edit2,
  KeyRound,
  Layers2,
  Loader2,
  Mail,
  Phone,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { Empresa } from "../../../types/empresa";
import { usePermission } from "../../hooks/usePermission";
import { maskCnpj, maskPhone } from "../../utils/masks";
import { matchesCompanySearch } from "./company-search";
import { Button, IconButton, Pagination } from "../../components/ui";

const ITEMS_PER_PAGE = 10;

type TableCompaniesProps = {
  empresas: Empresa[];
  isLoading?: boolean;
  handleOpenEmpenhos: (empresa: Empresa) => void;
  handleOpen: (empresa: Empresa) => void;
  handleOpenDelete: (empresa: Empresa) => void;
  handleOpenAccess: (empresa: Empresa) => void;
  onAdd?: () => void;
  searchTerm: string;
};

const TableCompanies = ({
  empresas,
  isLoading = false,
  handleOpenEmpenhos,
  handleOpen,
  handleOpenDelete,
  handleOpenAccess,
  onAdd,
  searchTerm,
}: TableCompaniesProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const filteredEmpresas = useMemo(
    () => empresas.filter((empresa) => matchesCompanySearch(empresa, searchTerm)),
    [empresas, searchTerm],
  );

  const { canEditAdministrativo, canCreateCompanyAccess } = usePermission();
  const showActions = canEditAdministrativo || canCreateCompanyAccess;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const totalPages = Math.ceil(filteredEmpresas.length / ITEMS_PER_PAGE);
  const paginatedEmpresas = filteredEmpresas.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-table">
          <thead className="bg-surface-muted border-b border-border">
            <tr>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wide cursor-pointer hover:text-text-primary transition-colors">
                <div className="flex items-center gap-1">
                  Empresa
                  <ArrowUp size={12} className="text-text-muted" />
                </div>
              </th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wide hidden md:table-cell">
                CNPJ
              </th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wide hidden sm:table-cell">
                Contato
              </th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wide cursor-pointer hover:text-text-primary transition-colors">
                <div className="flex items-center gap-1">
                  Empenhos
                  <ArrowDown size={12} className="text-text-muted" />
                </div>
              </th>
              {showActions && (
                <th className="text-right py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedEmpresas.map((empresa) => (
              <tr
                key={empresa.id}
                className="hover:bg-surface-muted/50 transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-surface-muted border border-border rounded-lg flex items-center justify-center shrink-0">
                      <Building2 size={16} className="text-text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary text-table">
                        {empresa.name}
                      </p>
                      <p className="text-xs text-text-secondary md:hidden">
                        {maskCnpj(empresa.cnpj)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-table text-text-secondary whitespace-nowrap hidden md:table-cell">
                  {maskCnpj(empresa.cnpj)}
                </td>
                <td className="py-3 px-4 hidden sm:table-cell">
                  <div className="text-xs text-text-secondary">
                    <p className="flex items-center gap-1">
                      <Phone size={12} />
                      {maskPhone(empresa.phone)}
                    </p>
                    <p className="flex items-center gap-1 text-xs mt-1">
                      <Mail size={12} />
                      {empresa.email}
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleOpenEmpenhos(empresa)}
                    className={`cursor-pointer inline-flex items-center gap-1 h-6 px-2 rounded-md border text-xs font-medium whitespace-nowrap transition-colors ${
                      empresa.empenhos.length > 0
                        ? "bg-surface-muted border-border text-text-primary hover:border-border-strong hover:bg-primary-100"
                        : "bg-surface border-border text-text-muted hover:bg-surface-muted"
                    }`}
                  >
                    <Layers2 size={12} />
                    {empresa.empenhos.length} empenho
                    {empresa.empenhos.length !== 1 ? "s" : ""}
                  </button>
                </td>
                {showActions && (
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      {canCreateCompanyAccess && (
                        <IconButton
                          icon={KeyRound}
                          label="Criar acesso"
                          size="sm"
                          onClick={() => handleOpenAccess(empresa)}
                        />
                      )}
                      {canEditAdministrativo && (
                        <>
                          <IconButton
                            icon={Edit2}
                            label="Editar"
                            size="sm"
                            onClick={() => handleOpen(empresa)}
                          />
                          <IconButton
                            icon={Trash2}
                            label="Excluir"
                            size="sm"
                            variant="danger"
                            onClick={() => handleOpenDelete(empresa)}
                          />
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {paginatedEmpresas.length === 0 &&
        (isLoading ? (
          <div className="py-8 text-center">
            <Loader2
              size={32}
              className="mx-auto text-text-muted animate-spin mb-3"
            />
            <p className="text-text-secondary text-sm">
              Carregando empresas...
            </p>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Building2 size={32} className="mx-auto text-text-muted mb-3" />
            <p className="text-sm text-text-secondary font-medium">
              Nenhuma empresa encontrada
            </p>
            <p className="text-text-muted text-sm mt-1">
              Tente ajustar os filtros ou cadastre uma nova empresa
            </p>
            {onAdd && (
              <Button icon={Plus} onClick={onAdd} className="mt-4">
                Cadastrar empresa
              </Button>
            )}
          </div>
        ))}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        totalItems={filteredEmpresas.length}
        itemsPerPage={ITEMS_PER_PAGE}
        itemLabel="empresas"
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default TableCompanies;
