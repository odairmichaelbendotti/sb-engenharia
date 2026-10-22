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
import { Button, IconButton, Pagination, Table, TableBody, TableHead, Td, Th, Tr } from "../../components/ui";

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
      <Table>
        <TableHead>
          {/* Setas decorativas (pendência conhecida: a ordenação não existe) */}
          <Th wrap>
            <span className="inline-flex items-center gap-1">
              Empresa
              <ArrowUp size={12} className="text-text-muted" />
            </span>
          </Th>
          <Th className="hidden md:table-cell">CNPJ</Th>
          <Th className="hidden sm:table-cell">Contato</Th>
          <Th>
            <span className="inline-flex items-center gap-1">
              Empenhos
              <ArrowDown size={12} className="text-text-muted" />
            </span>
          </Th>
          {showActions && <Th>Ações</Th>}
        </TableHead>
        <TableBody>
          {paginatedEmpresas.map((empresa) => (
            <Tr key={empresa.id}>
              {/* Nome longo quebra em até duas linhas; nome completo ao passar o mouse */}
              <Td wrap>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-surface-muted border border-border rounded-lg flex items-center justify-center shrink-0">
                    <Building2 size={16} className="text-text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary line-clamp-2" title={empresa.name}>
                      {empresa.name}
                    </p>
                    <p className="text-xs text-text-secondary md:hidden">{maskCnpj(empresa.cnpj)}</p>
                  </div>
                </div>
              </Td>
              <Td className="hidden md:table-cell">
                <span className="text-text-secondary">{maskCnpj(empresa.cnpj)}</span>
              </Td>
              <Td className="hidden sm:table-cell">
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
              </Td>
              <Td>
                <button
                  type="button"
                  onClick={() => handleOpenEmpenhos(empresa)}
                  className={`cursor-pointer inline-flex items-center gap-1 h-6 px-2 rounded-md border text-xs font-medium transition-colors ${
                    empresa.empenhos.length > 0
                      ? "bg-surface-muted border-border text-text-primary hover:border-border-strong hover:bg-primary-100"
                      : "bg-surface border-border text-text-muted hover:bg-surface-muted"
                  }`}
                >
                  <Layers2 size={12} />
                  {empresa.empenhos.length} empenho
                  {empresa.empenhos.length !== 1 ? "s" : ""}
                </button>
              </Td>
              {showActions && (
                <Td>
                  <div className="flex items-center gap-1">
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
                        <IconButton icon={Edit2} label="Editar" size="sm" onClick={() => handleOpen(empresa)} />
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
                </Td>
              )}
            </Tr>
          ))}
        </TableBody>
      </Table>

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
