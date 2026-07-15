import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUsers } from "../../store/users";
import { useUser } from "../../store/user";
import type { User } from "../../../types/user";
import { ConfirmModal } from "../../components/ConfirmModal";
import UsersHeader from "./UsersHeader";
import UsersTable from "./UsersTable";
import { ROLE_LABELS } from "./role-labels";

type PendingRoleChange = { user: User; role: User["role"] };

const Usuarios = () => {
  const { users, page, hasNextPage, listUsers, updateUserRole } = useUsers();
  const { user: currentUser } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingRoleChange | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

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
    if (currentUser?.role === "MASTER") {
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
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <UsersHeader />

      {isLoading ? (
        <div className="bg-surface border border-border rounded-lg py-16 flex flex-col items-center justify-center gap-2">
          <Loader2 size={24} className="animate-spin text-primary-500" />
          <p className="text-text-secondary text-sm">Carregando...</p>
        </div>
      ) : error ? (
        <div className="bg-surface border border-border rounded-lg py-16 flex flex-col items-center justify-center gap-2">
          <AlertCircle size={24} className="text-danger-text" />
          <p className="text-text-secondary text-sm">{error}</p>
          <button
            onClick={() => loadUsers(page)}
            className="mt-2 px-3 py-1.5 text-sm bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <UsersTable
            users={users}
            page={page}
            hasNextPage={hasNextPage}
            currentUserId={currentUser?.id ?? ""}
            assignableRoles={assignableRoles}
            onRequestRoleChange={(user, role) => setPendingChange({ user, role })}
            onPageChange={(updater) => loadUsers(updater(page))}
          />
        </div>
      )}

      <ConfirmModal
        open={!!pendingChange}
        variant="success"
        isLoading={isSaving}
        message={
          pendingChange
            ? `Alterar o papel de ${pendingChange.user.name} para ${ROLE_LABELS[pendingChange.role]}?`
            : ""
        }
        confirmLabel="Confirmar"
        onConfirm={handleConfirmRoleChange}
        onCancel={() => setPendingChange(null)}
      />
    </div>
  );
};

export default Usuarios;
