import { Building2, Check, Loader2, X } from "lucide-react";
import { getInitials } from "../../utils/get-initial";
import type { UnapprovedUser } from "../../../types/user";
import { Badge } from "../../components/ui";

export type RowStatus = "approving" | "approved" | "rejected";

interface ApprovalRowProps {
  user: UnapprovedUser;
  status: RowStatus | undefined;
  onRequestApprove: (user: UnapprovedUser) => void;
  onRequestReject: (user: UnapprovedUser) => void;
}

export function ApprovalRow({
  user,
  status,
  onRequestApprove,
  onRequestReject,
}: ApprovalRowProps) {
  const isResolved = status === "approved" || status === "rejected";
  const isBusy = status === "approving";
  const flashClass =
    status === "approved"
      ? "bg-success-bg"
      : status === "rejected"
        ? "bg-danger-bg"
        : "hover:bg-surface-muted/50";

  return (
    <tr
      className={`transition-all duration-250 ${flashClass} ${
        isResolved ? "opacity-0" : "opacity-100"
      }`}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-surface-muted border border-border rounded-full flex items-center justify-center text-text-primary font-semibold text-xs shrink-0">
            {getInitials(user.name)}
          </div>
          <p className="font-medium text-text-primary text-table truncate">
            {user.name}
          </p>
        </div>
      </td>
      <td className="py-3 px-4 text-center text-table text-text-secondary">
        {user.email}
      </td>
      <td className="py-3 px-4 text-center">
        <Badge icon={Building2}>{user.tenant.name}</Badge>
      </td>
      <td className="py-3 px-4">
        {/* Botões nativos: precisam do spinner e da animação "pop" no ícone, que o IconButton não oferece */}
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onRequestApprove(user)}
            disabled={!!status}
            className="inline-flex items-center justify-center w-8 h-8 cursor-pointer hover:bg-success-bg text-text-secondary hover:text-success-text rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary-200"
            title="Aprovar"
            aria-label="Aprovar"
          >
            {isBusy ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check
                size={16}
                className={status === "approved" ? "text-success-text animate-pop" : ""}
              />
            )}
          </button>
          <button
            type="button"
            onClick={() => onRequestReject(user)}
            disabled={!!status}
            className="inline-flex items-center justify-center w-8 h-8 cursor-pointer hover:bg-danger-bg text-text-secondary hover:text-danger-text rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary-200"
            title="Recusar"
            aria-label="Recusar"
          >
            <X
              size={16}
              className={status === "rejected" ? "text-danger-text animate-pop" : ""}
            />
          </button>
        </div>
      </td>
    </tr>
  );
}
