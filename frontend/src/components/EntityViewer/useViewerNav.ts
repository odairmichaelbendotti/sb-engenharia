import { usePermission } from "../../hooks/usePermission";
import { useEntityViewer, type EntityKind } from "../../store/entityViewer";

/**
 * Navegação entre registros dentro do modal: `linkTo` devolve o clique que empilha o registro,
 * ou `undefined` quando quem está logado não pode abrir aquele tipo (o cartão vira só leitura).
 */
export function useViewerNav() {
  const push = useEntityViewer((s) => s.push);
  const { canViewAdministrativo, isEmpresaRestricted } = usePermission();

  function canOpen(kind: EntityKind) {
    if (kind === "obra") return true;
    if (kind === "ordemServico") return canViewAdministrativo || isEmpresaRestricted;
    return canViewAdministrativo;
  }

  function linkTo(kind: EntityKind, id: string | null | undefined) {
    if (!id || !canOpen(kind)) return undefined;
    return () => push({ kind, id });
  }

  return { linkTo, canOpen };
}
