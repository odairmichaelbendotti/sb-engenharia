import { UserCheck } from "lucide-react";
import type { UnapprovedUser } from "../../../types/user";
import { Pagination } from "../../components/ui";
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
        <table className="w-full text-table">
          <thead className="bg-surface-muted border-b border-border">
            <tr>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Usuário
              </th>
              <th className="text-center py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                E-mail
              </th>
              <th className="text-center py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Organização
              </th>
              <th className="text-right py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wide">
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
        <div className="py-8 text-center">
          <UserCheck size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-sm text-text-secondary font-medium">
            {!hasPending
              ? "Nenhuma solicitação pendente"
              : "Nenhuma solicitação encontrada"}
          </p>
          <p className="text-text-muted text-xs mt-1">
            {!hasPending
              ? "Novas solicitações de acesso aparecem aqui"
              : "Tente ajustar a busca"}
          </p>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        totalItems={filteredCount}
        itemsPerPage={itemsPerPage}
        itemLabel="solicitações"
        onPageChange={(next) => onPageChange(() => next)}
      />
    </>
  );
}
