import { ChevronLeft, ChevronRight, UserRound, Users as UsersIcon } from "lucide-react";
import type { User } from "../../../types/user";
import { getInitials } from "../../utils/get-initial";
import { ROLE_LABELS } from "./role-labels";

type UsersTableProps = {
  users: User[];
  page: number;
  hasNextPage: boolean;
  currentUserId: string;
  assignableRoles: User["role"][];
  onRequestRoleChange: (user: User, role: User["role"]) => void;
  onPageChange: (updater: (page: number) => number) => void;
};

export default function UsersTable({
  users,
  page,
  hasNextPage,
  currentUserId,
  assignableRoles,
  onRequestRoleChange,
  onPageChange,
}: UsersTableProps) {
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
                Papel
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-text-secondary uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => {
              const canEditRole =
                assignableRoles.length > 0 &&
                user.id !== currentUserId &&
                user.approved;

              return (
                <tr
                  key={user.id}
                  className="hover:bg-surface-muted/50 transition-colors"
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
                    {canEditRole ? (
                      <select
                        value={user.role}
                        onChange={(e) =>
                          onRequestRoleChange(user, e.target.value as User["role"])
                        }
                        className="px-2 py-1 rounded text-xs font-medium border bg-surface-muted text-text-secondary border-border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-200"
                      >
                        {/* Garante que o papel atual sempre aparece, mesmo que quem edita não possa atribuí-lo (ex.: MASTER vendo um PLATFORM_ADMIN) */}
                        {!assignableRoles.includes(user.role) && (
                          <option value={user.role} disabled>
                            {ROLE_LABELS[user.role]}
                          </option>
                        )}
                        {assignableRoles.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border bg-surface-muted text-text-secondary border-border whitespace-nowrap">
                        <UserRound size={12} />
                        {ROLE_LABELS[user.role]}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${
                        user.approved
                          ? "bg-success-bg text-success-text border-success-border"
                          : "bg-warning-bg text-warning-text border-warning-border"
                      }`}
                    >
                      {user.approved ? "Aprovado" : "Pendente"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="py-12 text-center">
          <UsersIcon size={48} className="mx-auto text-text-muted mb-4" />
          <p className="text-text-secondary font-medium">Nenhum usuário encontrado</p>
        </div>
      )}

      {(page > 1 || hasNextPage) && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-muted">
          <p className="text-sm text-text-secondary">Página {page}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 hover:bg-surface cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => onPageChange((p) => p + 1)}
              disabled={!hasNextPage}
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
