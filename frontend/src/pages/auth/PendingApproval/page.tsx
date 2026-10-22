import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Mail, LogOut, Building2 } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useUser } from "../../../store/user";
import { getInitials } from "../../../utils/get-initial";
import { Badge, Button } from "../../../components/ui";

const POLL_INTERVAL_MS = 15000;

export default function PendingApproval() {
  const { user, fetchUser, logout } = useUser();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function poll() {
      setChecking(true);
      try {
        await fetchUser();
      } catch {
        // falha transitória: mantém a tela de espera e tenta de novo no próximo ciclo
      } finally {
        setChecking(false);
        setLastCheckedAt(new Date());
      }
    }

    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchUser]);

  async function handleLogout() {
    try {
      await logout();
      navigate("/signin");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  }

  async function handleManualCheck() {
    setChecking(true);
    try {
      await fetchUser();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? `Não foi possível verificar: ${error.message}`
          : "Não foi possível verificar agora",
      );
    } finally {
      setChecking(false);
      setLastCheckedAt(new Date());
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="relative w-full max-w-md">
        <div className="bg-surface border border-border rounded-xl shadow-sm p-8 flex flex-col items-center text-center">
          {/* Sonar / pulse indicator */}
          <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-primary-400/25 animate-ping-slow" />
            <span className="absolute inset-2 rounded-full bg-primary-400/20 animate-ping-slower" />
            <div className="relative w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <ShieldCheck size={28} className="text-white" strokeWidth={2} />
            </div>
          </div>

          <Badge tone="warning" className="mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-warning-text animate-pulse" />
            Aguardando aprovação
          </Badge>

          <h1 className="text-xl font-semibold tracking-tight text-text-primary">
            Sua conta está quase pronta
          </h1>
          <p className="text-text-secondary text-sm mt-2 leading-relaxed">
            Um administrador da sua organização precisa liberar seu acesso antes
            que você possa entrar no sistema. Isso costuma levar pouco tempo —
            você não precisa fazer nada além de aguardar.
          </p>

          {/* User card */}
          <div className="w-full mt-6 flex items-center gap-3 bg-surface-muted border border-border rounded-xl p-3 text-left">
            <div className="w-10 h-10 shrink-0 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {getInitials(user?.name || "Usuário")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary truncate">
                {user?.name || "Usuário"}
              </p>
              <p className="text-xs text-text-secondary truncate flex items-center gap-1">
                <Mail size={11} />
                {user?.email || "email@email.com"}
              </p>
            </div>
          </div>

          {/* Status line */}
          <div className="w-full mt-4 flex items-center justify-between text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <Building2 size={12} />
              Verificação automática ativa
            </span>
            <span>
              {checking
                ? "Verificando…"
                : `Última checagem às ${lastCheckedAt.toLocaleTimeString(
                    "pt-BR",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}`}
            </span>
          </div>

          {/* Actions */}
          <div className="w-full flex flex-col gap-2 mt-6">
            <Button fullWidth loading={checking} onClick={handleManualCheck}>
              {checking ? "Verificando status…" : "Verificar agora"}
            </Button>
            <Button variant="ghost" fullWidth icon={LogOut} onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-text-muted mt-4">
          Precisa de ajuda? Fale com o administrador responsável pela sua
          organização.
        </p>
      </div>
    </div>
  );
}
