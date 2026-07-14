import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUnapprovedUsers } from "../../store/unapprovedUsers";
import type { UnapprovedUser } from "../../../types/user";
import type { RowStatus } from "./ApprovalRow";
import { ConfirmModal } from "../../components/ConfirmModal";
import ApprovalHeader from "./ApprovalHeader";
import ApprovalFilters from "./ApprovalFilters";
import ApprovalTable from "./ApprovalTable";

const ITEMS_PER_PAGE = 10;
const RESOLVE_FLASH_MS = 500;
const COLLAPSE_MS = 250;

type PendingConfirmation = { type: "approve" | "reject"; user: UnapprovedUser };

const Aprovacoes = () => {
  const { users, hasLoaded, listUnapprovedUsers, approveUser, disapproveUser } =
    useUnapprovedUsers();
  const [pending, setPending] = useState<UnapprovedUser[]>([]);
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
      <ApprovalHeader />

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
            <ApprovalFilters
              searchTerm={searchTerm}
              onSearchChange={(value) => {
                setSearchTerm(value);
                setPage(1);
              }}
            />
            {searchTerm && (
              <p className="text-xs text-text-muted mt-2">
                {filteredPending.length} resultado
                {filteredPending.length !== 1 ? "s" : ""} para "{searchTerm}"
              </p>
            )}
          </div>

          <ApprovalTable
            paginatedPending={paginatedPending}
            hasPending={pending.length > 0}
            rowStatus={rowStatus}
            onRequestApprove={(u) => setConfirmation({ type: "approve", user: u })}
            onRequestReject={(u) => setConfirmation({ type: "reject", user: u })}
            currentPage={currentPage}
            totalPages={totalPages}
            startIndex={startIndex}
            itemsPerPage={ITEMS_PER_PAGE}
            filteredCount={filteredPending.length}
            onPageChange={setPage}
          />
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
