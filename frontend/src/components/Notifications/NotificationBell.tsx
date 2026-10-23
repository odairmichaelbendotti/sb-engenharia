import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Bell, CheckCheck } from "lucide-react";
import { useNotificacoes } from "../../store/notificacoes";
import { usePermission } from "../../hooks/usePermission";
import { formatDateTimeFull } from "../../utils/format-currency";
import { cx } from "../../utils/cx";
import type { Notificacao } from "../../../types/tramitacao";

// Avisos chegam sem e-mail: o sino consulta a API de tempos em tempos e ao voltar para a aba
const POLL_MS = 60_000;

interface NotificationBellProps {
  // Lado para onde o painel abre: no menu lateral, para a direita; no topo do celular, para a esquerda
  align?: "left" | "right";
}

export function NotificationBell({ align = "left" }: NotificationBellProps) {
  const { canDarCienciaOrdemServico, canTramitarOrdemServico } = usePermission();
  const enabled = canDarCienciaOrdemServico || canTramitarOrdemServico;
  const { notificacoes, naoLidas, fetchNotificacoes, marcarLida, marcarTodasLidas } = useNotificacoes();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled) return;
    const load = () => fetchNotificacoes().catch(() => {});
    load();
    const timer = window.setInterval(load, POLL_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [enabled, fetchNotificacoes]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!enabled) return null;

  function handleOpen(notificacao: Notificacao) {
    if (!notificacao.lidaEm) marcarLida(notificacao.id).catch(() => {});
    setOpen(false);
    if (notificacao.ordemServico_id) navigate(`/ordens-servico?os=${notificacao.ordemServico_id}`);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={naoLidas > 0 ? `Notificações: ${naoLidas} não lidas` : "Notificações"}
        title="Notificações"
        aria-expanded={open}
        className="cursor-pointer relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors"
      >
        <Bell size={16} />
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-danger-text text-text-inverse text-[10px] font-semibold leading-4 text-center tabular-nums">
            {naoLidas > 99 ? "99+" : naoLidas}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cx(
            "absolute top-full mt-2 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface shadow-xl overflow-hidden animate-row-in",
            align === "left" ? "left-0" : "right-0",
          )}
        >
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border">
            <p className="text-sm font-semibold text-text-primary">Notificações</p>
            {naoLidas > 0 && (
              <button
                type="button"
                onClick={() => marcarTodasLidas().catch(() => {})}
                className="cursor-pointer inline-flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary"
              >
                <CheckCheck size={12} /> Marcar todas como lidas
              </button>
            )}
          </div>
          {notificacoes.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-text-muted">Nenhuma notificação</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-border">
              {notificacoes.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleOpen(n)}
                    className={cx(
                      "cursor-pointer w-full text-left px-4 py-2.5 hover:bg-surface-muted transition-colors",
                      !n.lidaEm && "bg-surface-muted/60",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        aria-hidden
                        className={cx("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", n.lidaEm ? "bg-transparent" : "bg-primary-500")}
                      />
                      <div className="min-w-0">
                        <p className={cx("text-xs text-text-primary", !n.lidaEm && "font-semibold")}>{n.titulo}</p>
                        <p className="text-xs text-text-secondary line-clamp-2 mt-0.5">{n.mensagem}</p>
                        <p className="text-[11px] text-text-muted mt-0.5 tabular-nums">{formatDateTimeFull(n.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
