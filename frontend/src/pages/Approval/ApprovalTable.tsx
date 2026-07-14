import { ChevronLeft, ChevronRight, UserCheck } from "lucide-react";
import type { UnapprovedUser } from "../../../types/user";
import { ApprovalRow, type RowStatus } from "./ApprovalRow";

type ApprovalTableProps = {
  paginatedPending: UnapprovedUser[];
  hasPending: boolean;
  rowStatus: Record<string, RowStatus>;
  onRequestApprove: (user: UnapprovedUser) => void;
  onRequestReject: (user: UnapprovedUser) => void;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  itemsPerPage: number;
  filteredCount: number;
  onPageChange: (updater: (page: number) => number) => void;
};

export default function ApprovalTable({
  paginatedPending,
  hasPending,
  rowStatus,
  onRequestApprove,
  onRequestReject,
  currentPage,
  totalPages,
  startIndex,
  itemsPerPage,
  filteredCount,
  onPageChange,
}: ApprovalTableProps) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-muted border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Usuário
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                E-mail
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Organização
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedPending.map((user) => (
              <ApprovalRow
                key={user.id}
                user={user}
                status={rowStatus[user.id]}
                onRequestApprove={onRequestApprove}
                onRequestReject={onRequestReject}
              />
            ))}
          </tbody>
        </table>
      </div>

      {paginatedPending.length === 0 && (
        <div className="py-12 text-center">
          <UserCheck size={48} className="mx-auto text-text-muted mb-4" />
          <p className="text-text-secondary font-medium">
            {!hasPending
              ? "Nenhuma solicitação pendente"
              : "Nenhuma solicitação encontrada"}
          </p>
          <p className="text-text-muted text-sm mt-1">
            {!hasPending
              ? "Novas solicitações de acesso aparecem aqui"
              : "Tente ajustar a busca"}
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-muted">
          <p className="text-sm text-text-secondary">
            Mostrando {startIndex + 1} a{" "}
            {Math.min(startIndex + itemsPerPage, filteredCount)} de{" "}
            {filteredCount} solicitações
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 hover:bg-surface cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-text-secondary">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-surface cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
