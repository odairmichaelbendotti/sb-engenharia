import { ChevronLeft, ChevronRight, Eye, Users as UsersIcon } from "lucide-react";
import type { User } from "../../../types/user";
import { ActionMenu, IconButton, Select, StatusPill, Table, TableBody, TableHead, Td, Th, Tr } from "../../components/ui";
import { getInitials } from "../../utils/get-initial";
import { ROLE_LABELS } from "./role-labels";

type UsersTableProps = {
  users: User[];
  page: number;
  hasNextPage: boolean;
  currentUserId: string;
  assignableRoles: User["role"][];
  onView: (user: User) => void;
  onRequestRoleChange: (user: User, role: User["role"]) => void;
  onPageChange: (updater: (page: number) => number) => void;
};

export default function UsersTable({
  users,
  page,
  hasNextPage,
  currentUserId,
  assignableRoles,
  onView,
  onRequestRoleChange,
  onPageChange,
}: UsersTableProps) {
  return (
    <>
      <Table>
        <TableHead>
          <Th>Usuário</Th>
          <Th width="w-56" className="hidden sm:table-cell">
            Papel
          </Th>
          <Th width="w-32" className="hidden lg:table-cell">
            Status
          </Th>
          <Th actions />
        </TableHead>
        <TableBody>
          {users.map((user) => {
            const canEditRole =
              assignableRoles.length > 0 &&
              user.id !== currentUserId &&
              user.approved &&
              // Só PLATFORM_ADMIN mexe em quem já é PLATFORM_ADMIN
              (user.role !== "PLATFORM_ADMIN" || assignableRoles.includes("PLATFORM_ADMIN"));

            return (
              <Tr key={user.id} onOpen={() => onView(user)}>
                <Td>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-surface-muted border border-border rounded-full flex items-center justify-center text-text-primary font-semibold text-[11px] shrink-0">
                      {getInitials(user.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary truncate" title={user.name}>
                        {user.name}
                      </p>
                      <p className="text-[11px] text-text-muted truncate">{user.email}</p>
                    </div>
                  </div>
                </Td>
                {/* Mudar o papel no seletor não abre a linha */}
                <Td className="hidden sm:table-cell" actions={canEditRole}>
                  {canEditRole ? (
                    <Select
                      size="sm"
                      aria-label={`Papel de ${user.name}`}
                      className="w-48 text-left"
                      value={user.role}
                      onChange={(e) => onRequestRoleChange(user, e.target.value as User["role"])}
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
                    <span className="text-text-secondary">{ROLE_LABELS[user.role]}</span>
                  )}
                </Td>
                <Td className="hidden lg:table-cell">
                  <StatusPill tone={user.approved ? "success" : "warning"}>
                    {user.approved ? "Aprovado" : "Pendente"}
                  </StatusPill>
                </Td>
                <Td actions>
                  <ActionMenu
                    label={`Ações do usuário ${user.name}`}
                    items={[{ label: "Visualizar", icon: Eye, onClick: () => onView(user) }]}
                  />
                </Td>
              </Tr>
            );
          })}
        </TableBody>
      </Table>

      {users.length === 0 && (
        <div className="py-10 text-center">
          <UsersIcon size={28} className="mx-auto text-text-muted mb-2" />
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
