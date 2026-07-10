import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  UserCheck,
} from "lucide-react";
import { useUnapprovedUsers } from "../store/unapprovedUsers";
import type { User } from "../../types/user";
import { toast } from "sonner";
import { ApprovalRow, type RowStatus } from "./ApprovalRow";
import { ConfirmModal } from "../components/ConfirmModal";

const ITEMS_PER_PAGE = 10;
const RESOLVE_FLASH_MS = 500;
const COLLAPSE_MS = 250;

type PendingConfirmation = { type: "approve" | "reject"; user: User };

const Aprovacoes = () => {
  const { users, hasLoaded, listUnapprovedUsers, approveUser, disapproveUser } =
    useUnapprovedUsers();
  const [pending, setPending] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(!hasLoaded);
  const [error, setError] = useState<string | null>(null);
  const [rowStatus, setRowStatus] = useState<Record<string, RowStatus>>({});
  const [confirmation, setConfirmation] = useState<PendingConfirmation | null>(
    null,
  );

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

  async function handleReject(id: string) {
    if (rowStatus[id]) return;
    setRowStatus((prev) => ({ ...prev, [id]: "rejected" }));
    try {
      await disapproveUser(id);
      window.setTimeout(() => removeAfterCollapse(id), RESOLVE_FLASH_MS);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao recusar usuário",
      );
      setRowStatus((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  function handleConfirm() {
    if (!confirmation) return;
    const { type, user } = confirmation;
    setConfirmation(null);
    if (type === "approve") {
      handleApprove(user.id);
    } else {
      handleReject(user.id);
    }
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
                {paginatedPending.map((user, index) => (
                  <ApprovalRow
                    key={user.id}
                    user={user}
                    index={index}
                    status={rowStatus[user.id]}
                    onRequestApprove={(u) =>
                      setConfirmation({ type: "approve", user: u })
                    }
                    onRequestReject={(u) =>
                      setConfirmation({ type: "reject", user: u })
                    }
                  />
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
      )}

      <ConfirmModal
        open={!!confirmation}
        variant={confirmation?.type === "approve" ? "success" : "danger"}
        message={
          confirmation?.type === "approve"
            ? "Deseja realmente aprovar o usuário?"
            : "Deseja realmente negar o usuário?"
        }
        confirmLabel={confirmation?.type === "approve" ? "Aprovar" : "Negar"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmation(null)}
      />
    </div>
  );
};

export default Aprovacoes;
