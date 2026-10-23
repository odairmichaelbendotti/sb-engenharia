import { Building2, Check, X } from "lucide-react";
import { getInitials } from "../../utils/get-initial";
import type { UnapprovedUser } from "../../../types/user";
import { Button, Td, Tr } from "../../components/ui";

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
  // Destaque verde/vermelho ao resolver; o hover padrão vem da tabela
  const flashClass =
    status === "approved"
      ? "bg-success-bg"
      : status === "rejected"
        ? "bg-danger-bg"
        : "";

  return (
    <Tr
      className={`transition-all duration-250 ${flashClass} ${
        isResolved ? "opacity-0" : "opacity-100"
      }`}
    >
      <Td>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-surface-muted border border-border rounded-full flex items-center justify-center text-text-primary font-semibold text-[11px] shrink-0">
            {getInitials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-text-primary truncate" title={user.name}>
              {user.name}
            </p>
            <p className="text-[11px] text-text-muted truncate">
              {user.email}
              <span className="lg:hidden"> · {user.tenant.name}</span>
            </p>
          </div>
        </div>
      </Td>
      <Td className="hidden lg:table-cell">
        <span className="inline-flex items-center gap-1.5 text-text-primary max-w-full">
          <Building2 size={13} className="text-text-muted shrink-0" />
          <span className="truncate">{user.tenant.name}</span>
        </span>
      </Td>
      <Td>
        {/* Decisão direta (é o trabalho desta tela): recusar discreto, aprovar em destaque */}
        <div className="inline-flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            icon={X}
            onClick={() => onRequestReject(user)}
            disabled={!!status}
          >
            Recusar
          </Button>
          <Button
            variant="success"
            size="sm"
            icon={Check}
            loading={isBusy}
            onClick={() => onRequestApprove(user)}
            disabled={!!status}
          >
            Aprovar
          </Button>
        </div>
      </Td>
    </Tr>
  );
}
