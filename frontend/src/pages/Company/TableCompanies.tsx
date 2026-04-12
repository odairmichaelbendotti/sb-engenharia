import { useMemo, useState } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Layers2,
  Mail,
  MapPin,
  Phone,
  Trash2,
} from "lucide-react";
import type { Empresa } from "../../../types/empresa";
import { useUser } from "../../store/user";

const ITEMS_PER_PAGE = 10;

type TableCompaniesProps = {
  empresas: Empresa[];
  openEmpenhosModal: (empresa: Empresa) => void;
  openModal: (empresa: Empresa) => void;
  openDeleteModal: (empresa: Empresa) => void;
  searchTerm: string;
};

const TableCompanies = ({
  empresas,
  openEmpenhosModal,
  openModal,
  openDeleteModal,
  searchTerm,
}: TableCompaniesProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const filteredEmpresas = useMemo(() => {
    return empresas.filter(
      (empresa) =>
        empresa.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empresa.cnpj.includes(searchTerm) ||
        empresa.city.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [empresas, searchTerm]);

  const { user } = useUser();

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const totalPages = Math.ceil(filteredEmpresas.length / ITEMS_PER_PAGE);
  const paginatedEmpresas = filteredEmpresas.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-muted border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Empresa
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
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Empenhos
              </th>
              {(user?.role === "EDITOR" || user?.role === "MASTER") && (
                <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
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
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                      <Building2 size={18} className="text-primary-500" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary text-sm">
                        {empresa.name}
                      </p>
                      <p className="text-xs text-text-secondary md:hidden">
                        {empresa.cnpj}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-text-secondary hidden md:table-cell">
                  {empresa.cnpj}
                </td>
                <td className="py-3 px-4 hidden lg:table-cell">
                  <div className="flex items-center gap-1 text-sm text-text-secondary">
                    <MapPin size={14} />
                    <span>
                      {empresa.city}, {empresa.state}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 hidden sm:table-cell">
                  <div className="text-xs text-text-secondary">
                    <p className="flex items-center gap-1">
                      <Phone size={12} />
                      {empresa.phone}
                    </p>
                    <p className="flex items-center gap-1 text-xs mt-1">
                      <Mail size={12} />
                      {empresa.email}
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => openEmpenhosModal(empresa)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                      empresa.empenhos.length > 0
                        ? "bg-primary-100 text-primary-600 hover:bg-primary-200"
                        : "bg-surface-muted text-text-muted"
                    }`}
                  >
                    <Layers2 size={12} />
                    {empresa.empenhos.length} empenho
                    {empresa.empenhos.length !== 1 ? "s" : ""}
                  </button>
                </td>
                {(user?.role === "EDITOR" || user?.role === "MASTER") && (
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openModal(empresa)}
                        className="p-2 cursor-pointer hover:bg-primary-100 text-text-secondary hover:text-primary-500 rounded-md transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(empresa)}
                        className="p-2 cursor-pointer hover:bg-danger-bg text-text-secondary hover:text-danger-text rounded-md transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {paginatedEmpresas.length === 0 && (
        <div className="py-12 text-center">
          <Building2 size={48} className="mx-auto text-text-muted mb-4" />
          <p className="text-text-secondary font-medium">
            Nenhuma empresa encontrada
          </p>
          <p className="text-text-muted text-sm mt-1">
            Tente ajustar os filtros ou cadastre uma nova empresa
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-muted">
          <p className="text-sm text-text-secondary">
            Mostrando {startIndex + 1} a{" "}
            {Math.min(startIndex + ITEMS_PER_PAGE, filteredEmpresas.length)} de{" "}
            {filteredEmpresas.length} empresas
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-text-secondary">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableCompanies;
