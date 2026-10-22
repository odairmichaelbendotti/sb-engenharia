import { UserCheck } from "lucide-react";
import type { UnapprovedUser } from "../../../types/user";
import { Pagination, Table, TableBody, TableHead, Th } from "../../components/ui";
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
      <Table>
        <TableHead>
          <Th wrap>Usuário</Th>
          <Th>E-mail</Th>
          <Th>Organização</Th>
          <Th>Ações</Th>
        </TableHead>
        <TableBody>
          {paginatedPending.map((user) => (
            <ApprovalRow
              key={user.id}
              user={user}
              status={rowStatus[user.id]}
              onRequestApprove={onRequestApprove}
              onRequestReject={onRequestReject}
            />
          ))}
        </TableBody>
      </Table>

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
