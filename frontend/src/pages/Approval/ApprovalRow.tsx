import { Building2, Check, Loader2, X } from "lucide-react";
import { getInitials } from "../../utils/get-initial";
import type { UnapprovedUser } from "../../../types/user";

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
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
            {getInitials(user.name)}
          </div>
          <p className="font-medium text-text-primary text-sm truncate">
            {user.name}
          </p>
        </div>
      </td>
      <td className="py-3 px-4 text-center text-sm text-text-secondary">
        {user.email}
      </td>
      <td className="py-3 px-4 text-center">
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border bg-surface-muted text-text-secondary border-border whitespace-nowrap">
          <Building2 size={12} />
          {user.tenant.name}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onRequestApprove(user)}
            disabled={!!status}
            className="p-2 cursor-pointer hover:bg-success-bg text-text-secondary hover:text-success-text rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            title="Aprovar"
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
            onClick={() => onRequestReject(user)}
            disabled={!!status}
            className="p-2 cursor-pointer hover:bg-danger-bg text-text-secondary hover:text-danger-text rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            title="Recusar"
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
