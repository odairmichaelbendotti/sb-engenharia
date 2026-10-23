import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUsers } from "../../store/users";
import { useUser } from "../../store/user";
import type { User } from "../../../types/user";
import { UserViewModal } from "./UserViewModal";
import { Button, ConfirmDialog } from "../../components/ui";
import UsersHeader from "./UsersHeader";
import UsersTable from "./UsersTable";
import { ROLE_LABELS } from "./role-labels";
import { ROLE_GUIDE_BY_ROLE } from "./role-guide";
import { RoleGuideModal } from "./RoleGuideModal";

type PendingRoleChange = { user: User; role: User["role"] };

const Usuarios = () => {
  const { users, page, hasNextPage, listUsers, updateUserRole } = useUsers();
  const { user: currentUser } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingRoleChange | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  async function loadUsers(pageToLoad: number) {
    try {
      setIsLoading(true);
      setError(null);
      await listUsers(pageToLoad);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar usuários");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const assignableRoles = useMemo((): User["role"][] => {
    if (currentUser?.role === "PLATFORM_ADMIN") {
      return [
        "USER",
        "ENGENHARIA",
        "ADMINISTRATIVO",
        "COORDENACAO",
        "MASTER",
        "PLATFORM_ADMIN",
      ];
    }
    // COORDENACAO tem os mesmos poderes do MASTER sobre usuários
    if (currentUser?.role === "MASTER" || currentUser?.role === "COORDENACAO") {
      return ["USER", "ENGENHARIA", "ADMINISTRATIVO", "COORDENACAO", "MASTER"];
    }
    return [];
  }, [currentUser?.role]);

  async function handleConfirmRoleChange() {
    if (!pendingChange) return;
    setIsSaving(true);
    try {
      await updateUserRole(pendingChange.user.id, pendingChange.role);
      toast.success("Papel atualizado com sucesso");
      setPendingChange(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar o papel",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-5 max-w-7xl mx-auto">
      <UsersHeader
        onOpenGuide={assignableRoles.length > 0 ? () => setIsGuideOpen(true) : undefined}
      />

      {isLoading ? (
        <div className="bg-surface border border-border rounded-xl py-10 flex flex-col items-center justify-center gap-2">
          <Loader2 size={24} className="animate-spin text-text-muted" />
          <p className="text-text-secondary text-sm">Carregando...</p>
        </div>
      ) : error ? (
        <div className="bg-surface border border-border rounded-xl py-10 flex flex-col items-center justify-center gap-2">
          <AlertCircle size={24} className="text-danger-text" />
          <p className="text-text-secondary text-sm">{error}</p>
          <Button size="sm" className="mt-2" onClick={() => loadUsers(page)}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <UsersTable
            users={users}
            page={page}
            hasNextPage={hasNextPage}
            currentUserId={currentUser?.id ?? ""}
            assignableRoles={assignableRoles}
            onView={setViewingUser}
            onRequestRoleChange={(user, role) => setPendingChange({ user, role })}
            onPageChange={(updater) => loadUsers(updater(page))}
          />
        </div>
      )}

      <ConfirmDialog
        open={!!pendingChange}
        tone="neutral"
        loading={isSaving}
        title={pendingChange ? `Alterar o papel de ${pendingChange.user.name}?` : ""}
        confirmLabel="Alterar papel"
        onConfirm={handleConfirmRoleChange}
        onCancel={() => setPendingChange(null)}
      >
        {pendingChange && (
          <p>
            Novo papel: <span className="font-semibold text-text-primary">{ROLE_LABELS[pendingChange.role]}</span>. Com
            esse perfil, {ROLE_GUIDE_BY_ROLE[pendingChange.role].summary}.
          </p>
        )}
      </ConfirmDialog>

      {viewingUser && <UserViewModal user={viewingUser} onClose={() => setViewingUser(null)} />}

      <RoleGuideModal
        open={isGuideOpen}
        assignableRoles={assignableRoles}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
};

export default Usuarios;
