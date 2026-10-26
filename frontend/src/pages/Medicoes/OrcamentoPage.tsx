import { useParams } from "react-router";
import { EmptyNote } from "../../components/EntityViewer/ViewFrame";
import { OrcamentoEditor } from "./OrcamentoEditor";
import { OrcamentoLeitura } from "./OrcamentoLeitura";
import { usePlanilha } from "./usePlanilha";
import { WorkspaceHeader, WorkspacePage } from "./Workspace";
import { WorkspaceState } from "./WorkspaceState";

// /medicoes/:osId/orcamento — planilha orçamentária da OS em tela cheia
export default function OrcamentoPage() {
  const { osId = "" } = useParams();
  const { planilha, error, version, reload } = usePlanilha(osId);

  if (!planilha) {
    return (
      <WorkspacePage>
        <WorkspaceState error={error} onRetry={reload} />
      </WorkspacePage>
    );
  }

  return (
    <WorkspacePage>
      <WorkspaceHeader planilha={planilha} />
      {planilha.permissoes.editarOrcamento ? (
        <OrcamentoEditor key={version} planilha={planilha} onSaved={reload} />
      ) : planilha.itens.length > 0 ? (
        <OrcamentoLeitura planilha={planilha} />
      ) : (
        <EmptyNote>Nenhum orçamento lançado nesta OS.</EmptyNote>
      )}
    </WorkspacePage>
  );
}
