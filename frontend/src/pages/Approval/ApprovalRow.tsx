import { Check, Loader2, Mail, X } from "lucide-react";
import { getInitials } from "../utils/get-initial";
import type { User } from "../../types/user";

export type RowStatus = "approving" | "approved" | "rejected";

interface ApprovalRowProps {
  user: User;
  index: number;
  status: RowStatus | undefined;
  onRequestApprove: (user: User) => void;
  onRequestReject: (user: User) => void;
}

export function ApprovalRow({
  user,
  index,
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
        : "";

  return (
    <tr className="align-top">
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
                  onClick={() => onRequestApprove(user)}
                  disabled={!!status}
                  className="p-2 cursor-pointer hover:bg-success-bg text-text-secondary hover:text-success-text rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  title="Aprovar"
                >
                  {isBusy ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : status === "approved" ? (
                    <Check size={16} className="text-success-text animate-pop" />
                  ) : (
                    <Check size={16} />
                  )}
                </button>
                <button
                  onClick={() => onRequestReject(user)}
                  disabled={!!status}
                  className="p-2 cursor-pointer hover:bg-danger-bg text-text-secondary hover:text-danger-text rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  title="Recusar"
                >
                  {status === "rejected" ? (
                    <X size={16} className="text-danger-text animate-pop" />
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
}
