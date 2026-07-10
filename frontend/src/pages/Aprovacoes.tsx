import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Search,
  UserCheck,
  X,
} from "lucide-react";
import { getInitials } from "../utils/get-initial";
import { useUnapprovedUsers } from "../store/unapprovedUsers";
import type { User } from "../../types/user";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;
const RESOLVE_FLASH_MS = 500;
const COLLAPSE_MS = 250;

type RowStatus = "approving" | "approved" | "rejected";

const Aprovacoes = () => {
  const { users, hasLoaded, listUnapprovedUsers, approveUser } =
    useUnapprovedUsers();
  const [pending, setPending] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(!hasLoaded);
  const [error, setError] = useState<string | null>(null);
  const [rowStatus, setRowStatus] = useState<Record<string, RowStatus>>({});

  async function loadUnapprovedUsers() {
    try {
      setIsLoading(true);
      setError(null);
      await listUnapprovedUsers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao buscar usuários pendentes",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (hasLoaded) return;
    loadUnapprovedUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoaded]);

  useEffect(() => {
    setPending(users);
  }, [users]);

  function removeAfterCollapse(id: string) {
    window.setTimeout(() => {
      setPending((prev) => prev.filter((user) => user.id !== id));
      setRowStatus((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, COLLAPSE_MS);
  }

  async function handleApprove(id: string) {
    if (rowStatus[id]) return;
    setRowStatus((prev) => ({ ...prev, [id]: "approving" }));
    try {
      await approveUser(id);
      setRowStatus((prev) => ({ ...prev, [id]: "approved" }));
      window.setTimeout(() => removeAfterCollapse(id), RESOLVE_FLASH_MS);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao aprovar usuário",
      );
      setRowStatus((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  function handleReject(id: string) {
    if (rowStatus[id]) return;
    setRowStatus((prev) => ({ ...prev, [id]: "rejected" }));
    removeAfterCollapse(id);
  }

  const filteredPending = useMemo(() => {
    if (!searchTerm) return pending;
    const s = searchTerm.toLowerCase();
    return pending.filter(
      (user) =>
        user.name.toLowerCase().includes(s) ||
        user.email.toLowerCase().includes(s),
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

      {isLoading ? (
        <div className="bg-surface border border-border rounded-lg py-16 flex flex-col items-center justify-center gap-2">
          <Loader2 size={24} className="animate-spin text-primary-500" />
          <p className="text-text-secondary text-sm">Carregando...</p>
        </div>
      ) : error ? (
        <div className="bg-surface border border-border rounded-lg py-16 flex flex-col items-center justify-center gap-2">
          <AlertCircle size={24} className="text-danger-text" />
          <p className="text-text-secondary text-sm">{error}</p>
          <button
            onClick={() => loadUnapprovedUsers()}
            className="mt-2 px-3 py-1.5 text-sm bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="px-4 pt-3 pb-2 border-b border-border">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                placeholder="Buscar por nome ou e-mail..."
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
                  <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedPending.map((user, index) => {
                  const status = rowStatus[user.id];
                  const isResolved = status === "approved" || status === "rejected";
                  const isBusy = status === "approving";
                  const flashClass =
                    status === "approved"
                      ? "bg-success-bg"
                      : status === "rejected"
                        ? "bg-danger-bg"
                        : "";

                  return (
                    <tr key={user.id} className="align-top">
                      <td colSpan={2} className="p-0">
                        <div
                          className={`grid transition-[grid-template-rows] duration-250 ease-in ${
                            isResolved ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div
                              className={`grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 transition-colors duration-300 animate-row-in hover:bg-surface-muted/50 ${flashClass}`}
                              style={{
                                animationDelay: `${Math.min(index, 8) * 35}ms`,
                              }}
                            >
                              <div className="flex items-center gap-3 min-w-0">
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
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleApprove(user.id)}
                                  disabled={!!status}
                                  className="p-2 cursor-pointer hover:bg-success-bg text-text-secondary hover:text-success-text rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                  title="Aprovar"
                                >
                                  {isBusy ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : status === "approved" ? (
                                    <Check
                                      size={16}
                                      className="text-success-text animate-pop"
                                    />
                                  ) : (
                                    <Check size={16} />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleReject(user.id)}
                                  disabled={!!status}
                                  className="p-2 cursor-pointer hover:bg-danger-bg text-text-secondary hover:text-danger-text rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                  title="Recusar"
                                >
                                  {status === "rejected" ? (
                                    <X
                                      size={16}
                                      className="text-danger-text animate-pop"
                                    />
                                  ) : (
                                    <X size={16} />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
      )}
    </div>
  );
};

export default Aprovacoes;
