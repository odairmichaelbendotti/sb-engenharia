import { useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, Calculator, Eye, FileDown, Ruler, Send } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import type { MedicaoResumo, PlanilhaOrcamento } from "../../../types/medicao";
import { useMedicoes } from "../../store/medicoes";
import { useOrdensServico } from "../../store/ordensServico";
import { usePermission } from "../../hooks/usePermission";
import { formatCurrency, formatDateOnly } from "../../utils/format-currency";
import { downloadBlob } from "../../utils/download-file";
import { cx } from "../../utils/cx";
import {
  ActionMenu,
  Button,
  ConfirmDialog,
  FormSection,
  StatusPill,
  Table,
  TableBody,
  TableHead,
  Td,
  Th,
  Tr,
} from "../../components/ui";
import { EmptyNote } from "../../components/EntityViewer/ViewFrame";
import { MedicaoLeituraModal } from "./MedicaoLeituraModal";
import { orcamentoHref } from "./orcamento-link";
import { medicaoFilename, medicaoStatusDisplay, medicaoTitulo } from "./medicao-display";

interface OrcamentoMedicoesSectionProps {
  ordemServicoId: string;
  numero: string;
}

/**
 * Resumo do orçamento e das medições no modal da OS: saldo a medir e a lista de medições.
 * Lançar orçamento e medir ficam na tela Medições (Engenharia), que tem espaço para a planilha.
 */
export function OrcamentoMedicoesSection({ ordemServicoId, numero }: OrcamentoMedicoesSectionProps) {
  const { fetchPlanilha, fetchMedicaoDocument, emitirOrdemServico } = useMedicoes();
  const fetchOrdensServico = useOrdensServico((s) => s.fetchOrdensServico);
  const { canViewEngenharia } = usePermission();
  const navigate = useNavigate();
  const [planilha, setPlanilha] = useState<PlanilhaOrcamento | null>(null);
  const [error, setError] = useState(false);
  // Medição aberta em leitura (para quem não tem a tela Medições)
  const [lendo, setLendo] = useState<string | null>(null);
  // A empresa também tem a tela (só consulta)
  const temTela = canViewEngenharia;

  // Pedido de nova tentativa depois de um erro
  const [tentativa, setTentativa] = useState(0);
  const [emitindo, setEmitindo] = useState<"confirmar" | "enviando" | null>(null);

  useEffect(() => {
    let ativo = true;
    fetchPlanilha(ordemServicoId)
      .then((data) => {
        if (!ativo) return;
        setPlanilha(data);
        setError(false);
      })
      .catch(() => ativo && setError(true));
    return () => {
      ativo = false;
    };
  }, [fetchPlanilha, ordemServicoId, tentativa]);

  const reload = () => {
    setError(false);
    setTentativa((n) => n + 1);
  };

  async function baixarPdf(medicao: MedicaoResumo) {
    try {
      downloadBlob(await fetchMedicaoDocument(medicao.id), medicaoFilename(medicao.numero, numero));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar o PDF da medição");
    }
  }

  async function emitir() {
    setEmitindo("enviando");
    try {
      await emitirOrdemServico(ordemServicoId);
      toast.success("OS emitida: a empresa tem 48 horas para dar ciência.");
      // A lista traz a emissão (selo e tramitação) e esta seção recarrega a planilha
      await fetchOrdensServico().catch(() => undefined);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao emitir a ordem de serviço");
    } finally {
      setEmitindo(null);
    }
  }

  if (error) {
    return (
      <FormSection title="Orçamento e medições" icon={Ruler}>
        <p className="text-sm text-text-secondary">
          Não foi possível carregar o orçamento.{" "}
          <button type="button" className="underline cursor-pointer" onClick={reload}>
            Tentar de novo
          </button>
        </p>
      </FormSection>
    );
  }

  if (!planilha) {
    return (
      <FormSection title="Orçamento e medições" icon={Ruler}>
        <EmptyNote>Carregando orçamento...</EmptyNote>
      </FormSection>
    );
  }

  const { itens, permissoes } = planilha;
  const abrir = (medicao: MedicaoResumo) =>
    temTela ? navigate(`/medicoes/${ordemServicoId}/medicoes/${medicao.id}`) : setLendo(medicao.id);

  const atalho = temTela && (
    <Button
      variant="ghost"
      size="sm"
      icon={ArrowUpRight}
      onClick={() => navigate(`/medicoes/${ordemServicoId}/${itens.length > 0 ? "medicoes" : "orcamento"}`)}
    >
      {itens.length === 0 && permissoes.editarOrcamento ? "Lançar orçamento" : "Abrir em Medições"}
    </Button>
  );

  return (
    <FormSection title="Orçamento e medições" icon={Ruler} action={atalho || undefined}>
      {planilha.ordemServico.aguardandoEmissao && planilha.ordemServico.status === "ATIVO" && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2">
          <p className="text-xs text-text-secondary">
            {itens.length === 0
              ? "A OS aguarda o orçamento: o valor dela sai dos itens. Depois de lançá-lo, emita a OS para a empresa."
              : `Orçamento lançado (${formatCurrency(planilha.totais.valorOrcado)}). A empresa só vê a OS depois da emissão.`}
          </p>
          {permissoes.emitir && (
            <Button size="sm" icon={Send} onClick={() => setEmitindo("confirmar")}>
              Emitir OS
            </Button>
          )}
        </div>
      )}
      {itens.length === 0 ? (
        <EmptyNote>
          {permissoes.editarOrcamento
            ? "Nenhum orçamento lançado. Lance os itens do serviço na tela Medições para começar a medir."
            : "Nenhum orçamento lançado nesta OS."}
        </EmptyNote>
      ) : (
        <>
          <OrcamentoVinculado planilha={planilha} ordemServicoId={ordemServicoId} abreNaTela={temTela} />
          <MedicaoResumoBar planilha={planilha} />
          <MedicoesList planilha={planilha} editaNaTela={temTela} onOpen={abrir} onPdf={baixarPdf} />
        </>
      )}

      {lendo && <MedicaoLeituraModal medicaoId={lendo} numeroOs={numero} onClose={() => setLendo(null)} />}
      <ConfirmDialog
        open={emitindo !== null}
        tone="neutral"
        icon={Send}
        title={`Emitir a ${numero} para a empresa?`}
        confirmLabel="Emitir OS"
        loading={emitindo === "enviando"}
        onConfirm={emitir}
        onCancel={() => setEmitindo(null)}
      >
        A empresa passa a ver a OS, com o valor de {formatCurrency(planilha.totais.valorOrcado)}, e tem 48 horas
        para dar ciência. Depois disso, mudar o valor do orçamento reemite a OS.
      </ConfirmDialog>
    </FormSection>
  );
}

// Orçamento lançado em itens: totais e, para quem tem a tela Medições, o atalho em aba nova
function OrcamentoVinculado({
  planilha,
  ordemServicoId,
  abreNaTela,
}: {
  planilha: PlanilhaOrcamento;
  ordemServicoId: string;
  abreNaTela: boolean;
}) {
  const { totalComBdi, desconto, totais, itens } = planilha;
  const conteudo = (
    <>
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-success-bg text-success-text shrink-0">
        <Calculator size={16} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-success-text">Orçamento vinculado</span>
        <span className="block text-[11px] text-text-muted tabular-nums">
          {itens.length} {itens.length === 1 ? "item" : "itens"}
          {totalComBdi !== null && <> · c/ BDI {formatCurrency(totalComBdi)}</>}
          {desconto > 0 && <> · desconto {desconto.toLocaleString("pt-BR")}%</>}
        </span>
      </span>
      <span className="text-right shrink-0">
        <span className="block text-[11px] text-text-muted">Total c/ desconto</span>
        <span className="block text-sm font-semibold text-text-primary tabular-nums">
          {formatCurrency(totais.valorOrcado)}
        </span>
      </span>
    </>
  );
  const classes = "flex items-center gap-3 rounded-lg border border-success-border px-3 py-2";

  if (!abreNaTela) return <div className={classes}>{conteudo}</div>;

  return (
    <Link
      to={orcamentoHref(ordemServicoId)}
      target="_blank"
      rel="noopener"
      title="Abrir o orçamento em uma aba nova"
      className={cx(classes, "cursor-pointer hover:bg-success-bg/60 transition-colors")}
    >
      {conteudo}
      <ArrowUpRight size={14} className="text-text-muted shrink-0" aria-hidden />
    </Link>
  );
}

// Quanto do orçamento já foi medido (só medições fechadas), com o rascunho em tom mais claro
function MedicaoResumoBar({ planilha }: { planilha: PlanilhaOrcamento }) {
  const { totais, divergencia, valorOs } = planilha;
  const pct = (valor: number) => (totais.valorOrcado > 0 ? (valor / totais.valorOrcado) * 100 : 0);
  const medido = pct(totais.valorMedido);
  const rascunho = pct(totais.valorRascunho);
  const concluido = totais.valorSaldo <= 0;

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
            {concluido ? "Orçamento" : "Saldo a medir"}
          </p>
          <p
            className={cx(
              "text-[17px] font-bold tabular-nums tracking-tight mt-0.5",
              concluido ? "text-success-text" : "text-text-primary",
            )}
          >
            {concluido ? "Totalmente medido" : formatCurrency(totais.valorSaldo)}
          </p>
        </div>
        <p className="text-xs text-text-secondary text-right tabular-nums">
          {Math.round(medido * 10) / 10}% medido
          <br />
          de {formatCurrency(totais.valorOrcado)} orçados
        </p>
      </div>
      <div className="h-2 rounded-full bg-progress-track overflow-hidden flex">
        <div className="h-full bg-progress" style={{ width: `${Math.min(100, medido)}%` }} />
        {rascunho > 0 && (
          <div className="h-full bg-progress/35" style={{ width: `${Math.min(100 - medido, rascunho)}%` }} />
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary tabular-nums">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-progress" />
          Medido {formatCurrency(totais.valorMedido)}
        </span>
        {totais.valorRascunho > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-progress/35" />
            Em rascunho {formatCurrency(totais.valorRascunho)}
          </span>
        )}
      </div>
      {divergencia && valorOs !== null && (
        <p className="flex items-start gap-1.5 text-xs text-warning-text tabular-nums">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
          Soma dos itens {divergencia.diferenca > 0 ? "acima" : "abaixo"} do valor da OS ({formatCurrency(valorOs)}) em{" "}
          {formatCurrency(Math.abs(divergencia.diferenca))}
        </p>
      )}
    </div>
  );
}

function MedicoesList({
  planilha,
  editaNaTela,
  onOpen,
  onPdf,
}: {
  planilha: PlanilhaOrcamento;
  // "Visualizar" leva à tela Medições (onde também se edita o rascunho)
  editaNaTela: boolean;
  onOpen: (medicao: MedicaoResumo) => void;
  onPdf: (medicao: MedicaoResumo) => void;
}) {
  const { medicoes, permissoes } = planilha;
  if (medicoes.length === 0) {
    return <EmptyNote>Nenhuma medição lançada ainda.</EmptyNote>;
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table compact>
        <TableHead>
          <Th>Medição</Th>
          <Th>Situação</Th>
          <Th>Valor</Th>
          <Th actions />
        </TableHead>
        <TableBody>
          {medicoes.map((m) => {
            const st = medicaoStatusDisplay(m.status);
            const editavel = editaNaTela && m.status === "RASCUNHO" && permissoes.editarMedicoes;
            return (
              <Tr key={m.id} onOpen={() => onOpen(m)}>
                <Td>
                  <span className="block font-semibold text-text-primary">{medicaoTitulo(m.numero)}</span>
                  <span className="block text-[11px] text-text-muted">
                    {formatDateOnly(m.periodoInicio)} a {formatDateOnly(m.periodoFim)}
                  </span>
                </Td>
                <Td>
                  <StatusPill tone={st.tone} title={st.title} size="sm">
                    {st.label}
                  </StatusPill>
                </Td>
                <Td>{formatCurrency(m.valor)}</Td>
                <Td actions>
                  <ActionMenu
                    label={`Ações da ${medicaoTitulo(m.numero)}`}
                    items={[
                      {
                        label: editavel ? "Continuar em Medições" : "Visualizar",
                        icon: editavel ? ArrowUpRight : Eye,
                        onClick: () => onOpen(m),
                      },
                      { label: "Baixar PDF", icon: FileDown, onClick: () => onPdf(m) },
                    ]}
                  />
                </Td>
              </Tr>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
