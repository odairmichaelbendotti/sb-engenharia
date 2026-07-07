import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Mail,
  Search,
  UserCheck,
  X,
} from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import { getInitials } from "../utils/get-initial";
import { formatDateTime } from "../utils/format-currency";

const ITEMS_PER_PAGE = 10;

type PendingUser = {
  id: string;
  name: string;
  email: string;
  tenantName: string;
  requestedAt: string;
};

// Dados fake só para prévia visual — remover quando o backend expuser
// listagem/aprovação real de usuários pendentes.
const MOCK_PENDING_USERS: PendingUser[] = [
  {
    id: "1",
    name: "Carlos Eduardo Ramos",
    email: "carlos.ramos@sbengenharia.mil.br",
    tenantName: "1º Batalhão de Engenharia",
    requestedAt: "2026-07-05T14:32:00",
  },
  {
    id: "2",
    name: "Fernanda Lima Souza",
    email: "fernanda.souza@sbengenharia.mil.br",
    tenantName: "1º Batalhão de Engenharia",
    requestedAt: "2026-07-06T09:10:00",
  },
  {
    id: "3",
    name: "João Pedro Alencar",
    email: "joao.alencar@sbengenharia.mil.br",
    tenantName: "3º Grupamento de Engenharia",
    requestedAt: "2026-07-06T17:45:00",
  },
];

const Aprovacoes = () => {
  const [pending, setPending] = useState<PendingUser[]>(MOCK_PENDING_USERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  function handleApprove(id: string) {
    setPending((prev) => prev.filter((user) => user.id !== id));
  }

  function handleReject(id: string) {
    setPending((prev) => prev.filter((user) => user.id !== id));
  }

  const filteredPending = useMemo(() => {
    if (!searchTerm) return pending;
    const s = searchTerm.toLowerCase();
    return pending.filter(
      (user) =>
        user.name.toLowerCase().includes(s) ||
        user.email.toLowerCase().includes(s) ||
        user.tenantName.toLowerCase().includes(s),
    );
  }, [pending, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPending.length / ITEMS_PER_PAGE),
  );
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPending = filteredPending.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <Breadcrumb current="Aprovações" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <UserCheck size={20} className="text-primary-500" />
            Aprovações
          </h1>
          <p className="text-text-secondary text-xs mt-0.5">
            Solicitações de acesso de novos usuários aguardando liberação
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
              placeholder="Buscar por nome, e-mail ou organização..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
            />
          </div>
          {searchTerm && (
            <p className="text-xs text-text-muted mt-2">
              {filteredPending.length} resultado
              {filteredPending.length !== 1 ? "s" : ""} para "{searchTerm}"
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-muted border-b border-border">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                  Usuário
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden sm:table-cell">
                  Organização
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase hidden md:table-cell">
                  Solicitado em
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedPending.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-surface-muted/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {getInitials(user.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary text-sm truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-text-secondary flex items-center gap-1 truncate">
                          <Mail size={11} />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-text-secondary hidden sm:table-cell">
                    {user.tenantName}
                  </td>
                  <td className="py-3 px-4 text-sm text-text-secondary hidden md:table-cell">
                    {formatDateTime(user.requestedAt)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleApprove(user.id)}
                        className="p-2 cursor-pointer hover:bg-success-bg text-text-secondary hover:text-success-text rounded-md transition-colors"
                        title="Aprovar"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => handleReject(user.id)}
                        className="p-2 cursor-pointer hover:bg-danger-bg text-text-secondary hover:text-danger-text rounded-md transition-colors"
                        title="Recusar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedPending.length === 0 && (
          <div className="py-12 text-center">
            <UserCheck size={48} className="mx-auto text-text-muted mb-4" />
            <p className="text-text-secondary font-medium">
              {pending.length === 0
                ? "Nenhuma solicitação pendente"
                : "Nenhuma solicitação encontrada"}
            </p>
            <p className="text-text-muted text-sm mt-1">
              {pending.length === 0
                ? "Novas solicitações de acesso aparecem aqui"
                : "Tente ajustar a busca"}
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-muted">
            <p className="text-sm text-text-secondary">
              Mostrando {startIndex + 1} a{" "}
              {Math.min(startIndex + ITEMS_PER_PAGE, filteredPending.length)}{" "}
              de {filteredPending.length} solicitações
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-text-secondary">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-text-muted mt-4">
        Dados de exemplo — esta tela ainda depende de um endpoint no backend
        para listar e atualizar usuários pendentes.
      </p>
    </div>
  );
};

export default Aprovacoes;
