import { useCallback, useEffect, useRef } from "react";
import { useBlocker } from "react-router";
import { ConfirmDialog } from "../components/ui";

/**
 * Pergunta antes de sair de uma tela com alterações não salvas: navegação dentro do app (menu,
 * voltar, link) e fechar/recarregar a aba. `allowNextNavigation` libera a próxima navegação,
 * para a tela poder trocar de rota logo depois de salvar (o `dirty` só muda no próximo render).
 */
export function useUnsavedChangesGuard(dirty: boolean) {
  const dirtyRef = useRef(dirty);
  const bypassRef = useRef(false);
  useEffect(() => {
    dirtyRef.current = dirty;
    if (!dirty) bypassRef.current = false;
  }, [dirty]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirtyRef.current &&
      !bypassRef.current &&
      (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search),
  );

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const allowNextNavigation = useCallback(() => {
    bypassRef.current = true;
  }, []);

  const dialog = (
    <ConfirmDialog
      open={blocker.state === "blocked"}
      tone="danger"
      title="Sair sem salvar?"
      confirmLabel="Sair sem salvar"
      cancelLabel="Continuar editando"
      onConfirm={() => blocker.proceed?.()}
      onCancel={() => blocker.reset?.()}
    >
      As alterações feitas nesta tela ainda não foram salvas e serão perdidas.
    </ConfirmDialog>
  );

  return { dialog, allowNextNavigation };
}
