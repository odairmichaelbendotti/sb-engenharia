import { useEffect, useState } from "react";
import { FileDown, ListChecks, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Link, NavLink, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import type { MedicaoDetalhe, PlanilhaOrcamento } from "../../../types/medicao";
import { useMedicoes } from "../../store/medicoes";
import { downloadBlob } from "../../utils/download-file";
import { formatCurrency, formatDateOnly } from "../../utils/format-currency";
import { cx } from "../../utils/cx";
import { EmptyNote } from "../../components/EntityViewer/ViewFrame";
import { Button, ConfirmDialog } from "../../components/ui";
import { medicaoFilename, medicaoTitulo, MOTIVO_BLOQUEIO_LABEL } from "../OrdemServico/medicao-display";
import { MedicaoEditor } from "./MedicaoEditor";
import { MedicaoLeitura } from "./MedicaoLeitura";
import { usePlanilha } from "./usePlanilha";
import { StickyFooter, WorkspaceHeader, WorkspacePage } from "./Workspace";
import { WorkspaceState } from "./WorkspaceState";
import { invoiceLabel } from "../../utils/status-display";

const NOVA = "nova";

// "excluir" = rascunho; "excluirFechada" = a última medição fechada
type Acao = "reabrir" | "excluir" | "excluirFechada";

/**
 * /medicoes/:osId/medicoes/:medicaoId? — medições da OS. Sem id, abre o rascunho, senão a última
 * medição, senão uma nova; `nova` é a medição ainda não gravada.
 */
export default function MedicaoPage() {
  const { osId = "", medicaoId } = useParams();
  const navigate = useNavigate();
  const { planilha, error, version, reload } = usePlanilha(osId);
  const { fetchMedicao, fetchMedicaoDocument, reabrirMedicao, deleteMedicao } = useMedicoes();
  const [detalhe, setDetalhe] = useState<MedicaoDetalhe | null>(null);
  const [detalheErro, setDetalheErro] = useState<string | null>(null);
  const [acao, setAcao] = useState<Acao | null>(null);
  const [executando, setExecutando] = useState(false);
  const [baixando, setBaixando] = useState(false);

  // Sem medição na URL: escolhe a que faz sentido abrir
  useEffect(() => {
    if (!planilha || medicaoId) return;
    const { medicoes, permissoes } = planilha;
    const alvo =
      medicoes.find((m) => m.status === "RASCUNHO")?.id ?? medicoes.at(-1)?.id ?? (permissoes.criarMedicao ? NOVA : null);
    if (alvo) navigate(`/medicoes/${osId}/medicoes/${alvo}`, { replace: true });
  }, [planilha, medicaoId, osId, navigate]);

  // Medição aberta: busca de novo a cada recarga da planilha (salvou, fechou, reabriu)
  useEffect(() => {
    if (!medicaoId || medicaoId === NOVA) {
      setDetalhe(null);
      return;
    }
    let ativo = true;
    setDetalheErro(null);
    fetchMedicao(medicaoId)
      .then((data) => ativo && setDetalhe(data))
      .catch((err) => ativo && setDetalheErro(err instanceof Error ? err.message : "Erro ao carregar a medição"));
    return () => {
      ativo = false;
    };
  }, [medicaoId, version, fetchMedicao]);

  // Gravou: vai para a medição (a criada agora troca a URL) e recarrega planilha e medição
  const salvou = (id: string) => {
    if (id !== medicaoId) navigate(`/medicoes/${osId}/medicoes/${id}`);
    reload();
  };

  if (!planilha) {
    return (
      <WorkspacePage>
        <WorkspaceState error={error} onRetry={reload} />
      </WorkspacePage>
    );
  }

  async function baixarPdf(alvo: MedicaoDetalhe) {
    setBaixando(true);
    try {
      downloadBlob(await fetchMedicaoDocument(alvo.id), medicaoFilename(alvo.numero, alvo.ordemServico.numero));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar o PDF da medição");
    } finally {
      setBaixando(false);
    }
  }

  async function executarAcao() {
    if (!acao || !detalhe) return;
    setExecutando(true);
    try {
      if (acao === "reabrir") {
        await reabrirMedicao(detalhe.id);
        toast.success(`${medicaoTitulo(detalhe.numero)} reaberta`);
      } else {
        await deleteMedicao(detalhe.id);
        toast.success(acao === "excluir" ? "Rascunho excluído" : `${medicaoTitulo(detalhe.numero)} excluída`);
        navigate(`/medicoes/${osId}/medicoes`, { replace: true });
      }
      setAcao(null);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar a medição");
    } finally {
      setExecutando(false);
    }
  }

  const resumo = planilha.medicoes.find((m) => m.id === detalhe?.id);
  const carregando = medicaoId && medicaoId !== NOVA && detalhe?.id !== medicaoId;

  return (
    <WorkspacePage>
      <WorkspaceHeader planilha={planilha} />
      <HistoricoMedicoes planilha={planilha} osId={osId} atual={medicaoId} />

      {planilha.itens.length === 0 ? (
        <SemOrcamento planilha={planilha} osId={osId} />
      ) : medicaoId === NOVA ? (
        planilha.permissoes.criarMedicao ? (
          <MedicaoEditor key={`nova-${version}`} planilha={planilha} detalhe={null} onSaved={salvou} />
        ) : (
          <EmptyNote>
            {planilha.permissoes.motivo ? MOTIVO_BLOQUEIO_LABEL[planilha.permissoes.motivo] : "Não é possível lançar uma medição agora."}
          </EmptyNote>
        )
      ) : !medicaoId ? (
        <EmptyNote>Nenhuma medição lançada nesta OS.</EmptyNote>
      ) : detalheErro ? (
        <EmptyNote>{detalheErro}</EmptyNote>
      ) : carregando || !detalhe ? (
        <EmptyNote>Carregando medição...</EmptyNote>
      ) : detalhe.permissoes.editar ? (
        <MedicaoEditor
          key={`${detalhe.id}-${version}`}
          planilha={planilha}
          detalhe={detalhe}
          onSaved={salvou}
          onDelete={detalhe.permissoes.excluir ? () => setAcao("excluir") : undefined}
          onPdf={() => baixarPdf(detalhe)}
          baixandoPdf={baixando}
        />
      ) : (
        <>
          <div className="pb-5">
            <MedicaoLeitura detalhe={detalhe} />
          </div>
          <StickyFooter
            summary={
              <p className="text-sm text-text-secondary">
                {medicaoTitulo(detalhe.numero)} ·{" "}
                <span className="font-semibold text-text-primary tabular-nums">
                  {formatCurrency(detalhe.totais.valorEsta)}
                </span>
                <span className="text-text-muted"> · {detalhe.status === "FECHADA" ? "fechada" : "rascunho"}</span>
                {/* Paga por nota fiscal: não reabre nem sai enquanto a nota não for cancelada */}
                {resumo?.notaFiscal && <span className="text-text-muted"> · paga pela {invoiceLabel(resumo.notaFiscal.numero)}</span>}
              </p>
            }
          >
            {resumo?.podeReabrir && (
              <>
                <Button variant="danger" icon={Trash2} onClick={() => setAcao("excluirFechada")}>
                  Excluir
                </Button>
                <Button variant="secondary" icon={RotateCcw} onClick={() => setAcao("reabrir")}>
                  Reabrir
                </Button>
              </>
            )}
            <Button icon={FileDown} loading={baixando} onClick={() => baixarPdf(detalhe)}>
              Baixar PDF
            </Button>
          </StickyFooter>
        </>
      )}

      <ConfirmDialog
        open={acao !== null}
        tone={acao === "reabrir" ? "neutral" : "danger"}
        icon={acao === "reabrir" ? RotateCcw : undefined}
        title={
          detalhe
            ? acao === "reabrir"
              ? `Reabrir a ${medicaoTitulo(detalhe.numero)}?`
              : acao === "excluirFechada"
                ? `Excluir a ${medicaoTitulo(detalhe.numero)}?`
                : `Excluir o rascunho da ${medicaoTitulo(detalhe.numero).toLowerCase()}?`
            : ""
        }
        confirmLabel={acao === "reabrir" ? "Reabrir medição" : acao === "excluirFechada" ? "Excluir medição" : "Excluir rascunho"}
        loading={executando}
        onConfirm={executarAcao}
        onCancel={() => setAcao(null)}
      >
        {acao === "reabrir"
          ? "Ela volta a ser rascunho e sai do acumulado até ser fechada de novo. O boletim impresso antes deixa de valer."
          : acao === "excluirFechada"
            ? "As quantidades medidas voltam ao saldo do orçamento e o boletim impresso desta medição deixa de valer. Esta ação não pode ser desfeita."
            : "As quantidades lançadas neste rascunho serão descartadas."}
      </ConfirmDialog>
    </WorkspacePage>
  );
}

// Faixa com todas as medições da OS e a "+ Nova": o histórico fica a um clique
function HistoricoMedicoes({ planilha, osId, atual }: { planilha: PlanilhaOrcamento; osId: string; atual?: string }) {
  const { medicoes, permissoes } = planilha;
  if (medicoes.length === 0 && !permissoes.criarMedicao) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-3" aria-label="Medições da OS">
      {medicoes.map((m) => {
        const rascunho = m.status === "RASCUNHO";
        return (
          <NavLink
            key={m.id}
            to={`/medicoes/${osId}/medicoes/${m.id}`}
            title={`${formatDateOnly(m.periodoInicio)} a ${formatDateOnly(m.periodoFim)} · ${formatCurrency(m.valor)}`}
            className={({ isActive }) => chipClass(isActive)}
          >
            {({ isActive }) => (
              <>
                {String(m.numero).padStart(2, "0")}
                <span className={cx("text-[11px]", isActive ? "text-white/80" : rascunho ? "text-warning-text" : "text-text-muted")}>
                  {rascunho ? "rascunho" : `até ${formatDateOnly(m.periodoFim)}`}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
      {permissoes.criarMedicao && (
        <Link to={`/medicoes/${osId}/medicoes/${NOVA}`} className={chipClass(atual === NOVA)}>
          <Plus size={12} />
          Nova medição
        </Link>
      )}
    </div>
  );
}

function chipClass(active: boolean) {
  return cx(
    "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors cursor-pointer tabular-nums",
    active
      ? "bg-primary-500 border-primary-500 text-white"
      : "bg-surface border-border text-text-secondary hover:bg-surface-muted hover:text-text-primary",
  );
}

function SemOrcamento({ planilha, osId }: { planilha: PlanilhaOrcamento; osId: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl py-10 text-center">
      <ListChecks size={28} className="mx-auto text-text-muted mb-2" />
      <p className="text-sm text-text-secondary font-medium">Esta OS ainda não tem orçamento</p>
      <p className="text-text-muted text-xs mt-1">A medição é feita sobre os itens do orçamento.</p>
      {planilha.permissoes.editarOrcamento && (
        <Link
          to={`/medicoes/${osId}/orcamento`}
          className="mt-4 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary-500 text-white text-xs font-semibold cursor-pointer hover:bg-primary-600"
        >
          <ListChecks size={14} />
          Lançar orçamento
        </Link>
      )}
    </div>
  );
}
