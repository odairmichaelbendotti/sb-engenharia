import { useEffect, useRef } from "react";
import { useEntityViewer, type EntityKind } from "../store/entityViewer";

/**
 * A página que tem o formulário de um tipo de registro registra aqui o "Editar": o modal de
 * visualização mostra o botão para esse tipo enquanto a página está aberta (e se `enabled`).
 */
export function useEntityEditor(kind: EntityKind, onEdit: (id: string) => void, enabled = true) {
  const registerEditor = useEntityViewer((s) => s.registerEditor);
  const onEditRef = useRef(onEdit);
  useEffect(() => {
    onEditRef.current = onEdit;
  });

  useEffect(() => {
    if (!enabled) return;
    return registerEditor(kind, (id) => onEditRef.current(id));
  }, [kind, enabled, registerEditor]);
}
