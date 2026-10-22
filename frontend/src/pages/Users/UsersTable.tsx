import { ChevronLeft, ChevronRight, UserRound, Users as UsersIcon } from "lucide-react";
import type { User } from "../../../types/user";
import { Badge, IconButton, Select } from "../../components/ui";
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
                Papel
              </th>
              <th className="text-center py-2.5 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => {
              const canEditRole =
                assignableRoles.length > 0 &&
                user.id !== currentUserId &&
                user.approved &&
                // Só PLATFORM_ADMIN mexe em quem já é PLATFORM_ADMIN
                (user.role !== "PLATFORM_ADMIN" || assignableRoles.includes("PLATFORM_ADMIN"));

              return (
                <tr
                  key={user.id}
                  className="hover:bg-surface-muted/50 transition-colors"
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
                    {canEditRole ? (
                      <Select
                        size="sm"
                        aria-label={`Papel de ${user.name}`}
                        className="inline-block w-44 text-left"
                        value={user.role}
                        onChange={(e) =>
                          onRequestRoleChange(user, e.target.value as User["role"])
                        }
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
                      </Select>
                    ) : (
                      <Badge icon={UserRound}>{ROLE_LABELS[user.role]}</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge tone={user.approved ? "success" : "warning"}>
                      {user.approved ? "Aprovado" : "Pendente"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="py-8 text-center">
          <UsersIcon size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-sm text-text-secondary font-medium">Nenhum usuário encontrado</p>
        </div>
      )}

      {/* Paginação por cursor (sem total de itens), por isso não usa o Pagination do ui */}
      {(page > 1 || hasNextPage) && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-border bg-surface-muted">
          <p className="text-xs text-text-secondary">Página {page}</p>
          <div className="flex items-center gap-1">
            <IconButton
              icon={ChevronLeft}
              label="Página anterior"
              size="sm"
              onClick={() => onPageChange((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            />
            <IconButton
              icon={ChevronRight}
              label="Próxima página"
              size="sm"
              onClick={() => onPageChange((p) => p + 1)}
              disabled={!hasNextPage}
            />
          </div>
        </div>
      )}
    </>
  );
}
