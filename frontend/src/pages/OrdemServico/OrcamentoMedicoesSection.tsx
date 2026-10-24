import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, FileDown, ListPlus, Pencil, Plus, RotateCcw, Ruler, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { MedicaoResumo, PlanilhaOrcamento } from "../../../types/medicao";
import { useMedicoes } from "../../store/medicoes";
import { formatCurrency, formatDateOnly } from "../../utils/format-currency";
import { downloadBlob } from "../../utils/download-file";
import { formatQuantidade } from "../../utils/decimal";
import { cx } from "../../utils/cx";
import {
  ActionMenu,
  Button,
  ConfirmDialog,
  FormSection,
  StatusPill,
  Table,
  TableBody,
  TableFoot,
  TableHead,
  Td,
  Th,
  Tr,
} from "../../components/ui";
import { EmptyNote } from "../../components/EntityViewer/ViewFrame";
import { OrcamentoModal } from "./OrcamentoModal";
import { MedicaoModal } from "./MedicaoModal";
import { medicaoFilename, medicaoStatusDisplay, medicaoTitulo, MOTIVO_BLOQUEIO_LABEL } from "./medicao-display";

type Acao = { tipo: "fechar" | "reabrir" | "excluir"; medicao: MedicaoResumo };

interface OrcamentoMedicoesSectionProps {
  ordemServicoId: string;
  numero: string;
}

// Orçamento da OS (planilha de itens), panorama do que já foi medido e a lista de medições
export function OrcamentoMedicoesSection({ ordemServicoId, numero }: OrcamentoMedicoesSectionProps) {
  const { fetchPlanilha, fecharMedicao, reabrirMedicao, deleteMedicao, fetchMedicaoDocument } = useMedicoes();
  const [planilha, setPlanilha] = useState<PlanilhaOrcamento | null>(null);
  const [error, setError] = useState(false);
  const [editandoOrcamento, setEditandoOrcamento] = useState(false);
  // undefined = fechado; null = nova medição; id = medição existente
  const [medicaoAberta, setMedicaoAberta] = useState<string | null | undefined>(undefined);
  const [acao, setAcao] = useState<Acao | null>(null);
  const [executando, setExecutando] = useState(false);

  const reload = useCallback(async () => {
    try {
      setPlanilha(await fetchPlanilha(ordemServicoId));
      setError(false);
    } catch {
      setError(true);
    }
  }, [fetchPlanilha, ordemServicoId]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function baixarPdf(medicao: MedicaoResumo) {
    try {
      downloadBlob(await fetchMedicaoDocument(medicao.id), medicaoFilename(medicao.numero, numero));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar o PDF da medição");
    }
  }

  async function executarAcao() {
    if (!acao) return;
    setExecutando(true);
    const titulo = medicaoTitulo(acao.medicao.numero);
    try {
      if (acao.tipo === "fechar") await fecharMedicao(acao.medicao.id);
      if (acao.tipo === "reabrir") await reabrirMedicao(acao.medicao.id);
      if (acao.tipo === "excluir") await deleteMedicao(acao.medicao.id);
      toast.success(
        acao.tipo === "fechar" ? `${titulo} fechada` : acao.tipo === "reabrir" ? `${titulo} reaberta` : "Rascunho excluído",
      );
      setAcao(null);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar a medição");
    } finally {
      setExecutando(false);
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

  const { itens, permissoes, medicoes } = planilha;
  const rascunho = medicoes.find((m) => m.status === "RASCUNHO");
  const editor = permissoes.editarMedicoes;

  const botoes = (
    <div className="flex items-center gap-1.5 shrink-0">
      {permissoes.editarOrcamento && (
        <Button variant="ghost" size="sm" icon={itens.length > 0 ? Pencil : ListPlus} onClick={() => setEditandoOrcamento(true)}>
          {itens.length > 0 ? "Editar orçamento" : "Lançar orçamento"}
        </Button>
      )}
      {editor && itens.length > 0 &&
        (rascunho ? (
          <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setMedicaoAberta(rascunho.id)}>
            Continuar {medicaoTitulo(rascunho.numero).toLowerCase()}
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            disabled={!permissoes.criarMedicao}
            title={permissoes.motivo ? MOTIVO_BLOQUEIO_LABEL[permissoes.motivo] : undefined}
            onClick={() => setMedicaoAberta(null)}
          >
            Nova medição
          </Button>
        ))}
    </div>
  );

  return (
    <FormSection title="Orçamento e medições" icon={Ruler} action={botoes}>
      {itens.length === 0 ? (
        <EmptyNote>
          {permissoes.editarOrcamento
            ? "Nenhum orçamento lançado. Lance os itens do serviço (descrição, unidade, quantidade e preço unitário) para começar a medir."
            : "Nenhum orçamento lançado nesta OS."}
        </EmptyNote>
      ) : (
        <>
          <MedicaoResumoBar planilha={planilha} />
          <PanoramaTable planilha={planilha} />
          <MedicoesList
            planilha={planilha}
            onOpen={(m) => setMedicaoAberta(m.id)}
            onPdf={baixarPdf}
            onAcao={(tipo, medicao) => setAcao({ tipo, medicao })}
          />
        </>
      )}

      {editandoOrcamento && (
        <OrcamentoModal
          open
          ordemServicoId={ordemServicoId}
          numero={numero}
          itens={itens}
          valorOs={planilha.valorOs}
          onClose={() => setEditandoOrcamento(false)}
          onSaved={() => {
            setEditandoOrcamento(false);
            reload();
          }}
        />
      )}

      {medicaoAberta !== undefined && (
        <MedicaoModal
          open
          ordemServicoId={ordemServicoId}
          numeroOs={numero}
          planilha={planilha}
          medicaoId={medicaoAberta}
          onClose={() => setMedicaoAberta(undefined)}
          onChanged={reload}
        />
      )}

      <ConfirmDialog
        open={acao !== null}
        tone={acao?.tipo === "excluir" ? "danger" : acao?.tipo === "fechar" ? "success" : "neutral"}
        icon={acao?.tipo === "reabrir" ? RotateCcw : undefined}
        title={
          acao
            ? `${acao.tipo === "fechar" ? "Fechar" : acao.tipo === "reabrir" ? "Reabrir" : "Excluir o rascunho da"} ${
                acao.tipo === "excluir" ? medicaoTitulo(acao.medicao.numero).toLowerCase() : `a ${medicaoTitulo(acao.medicao.numero)}`
              }?`
            : ""
        }
        confirmLabel={acao?.tipo === "fechar" ? "Fechar medição" : acao?.tipo === "reabrir" ? "Reabrir medição" : "Excluir rascunho"}
        loading={executando}
        onConfirm={executarAcao}
        onCancel={() => setAcao(null)}
      >
        {acao?.tipo === "fechar" &&
          `A medição de ${formatCurrency(acao.medicao.valor)} entra no acumulado da OS e fica travada. Para corrigir depois, só a última medição fechada pode ser reaberta.`}
        {acao?.tipo === "reabrir" &&
          "Ela volta a ser rascunho e sai do acumulado até ser fechada de novo. O boletim impresso antes deixa de valer."}
        {acao?.tipo === "excluir" && "As quantidades lançadas neste rascunho serão descartadas."}
      </ConfirmDialog>
    </FormSection>
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
      <div className="h-2 rounded-full bg-surface-muted overflow-hidden flex">
        <div className="h-full bg-secondary-500" style={{ width: `${Math.min(100, medido)}%` }} />
        {rascunho > 0 && (
          <div className="h-full bg-secondary-500/35" style={{ width: `${Math.min(100 - medido, rascunho)}%` }} />
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary tabular-nums">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-secondary-500" />
          Medido {formatCurrency(totais.valorMedido)}
        </span>
        {totais.valorRascunho > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-secondary-500/35" />
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

// Orçado, medido e saldo de cada item
function PanoramaTable({ planilha }: { planilha: PlanilhaOrcamento }) {
  const { itens, totais } = planilha;
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table compact>
        <TableHead>
          <Th>Item</Th>
          <Th>Orçado</Th>
          <Th>Medido</Th>
          <Th>Saldo</Th>
        </TableHead>
        <TableBody>
          {itens.map((item) => (
            <Tr key={item.id} muted={item.completo}>
              <Td>
                <span className="block text-text-primary line-clamp-2" title={item.descricao}>
                  {item.ordem}. {item.descricao}
                </span>
                <span className="block text-[11px] text-text-muted">
                  {[item.codigo, `${formatCurrency(item.precoUnitario)}/${item.unidade}`].filter(Boolean).join(" · ")}
                </span>
              </Td>
              <Td>
                <span className="block">
                  {formatQuantidade(item.quantidade)} {item.unidade}
                </span>
                <span className="block text-[11px] text-text-muted">{formatCurrency(item.valorTotal)}</span>
              </Td>
              <Td>
                <span className="block">{formatQuantidade(item.medido)}</span>
                {item.rascunho > 0 ? (
                  <span
                    className={cx("block text-[11px]", item.excedeSaldo ? "text-danger-text" : "text-text-muted")}
                    title={item.excedeSaldo ? "O rascunho passou do saldo: corrija antes de fechar" : undefined}
                  >
                    +{formatQuantidade(item.rascunho)} no rascunho
                  </span>
                ) : (
                  <span className="block text-[11px] text-text-muted">{formatCurrency(item.valorMedido)}</span>
                )}
              </Td>
              <Td>
                {item.completo ? (
                  <StatusPill tone="success" size="sm">
                    Concluído
                  </StatusPill>
                ) : (
                  <>
                    <span className="block font-semibold text-text-primary">
                      {formatQuantidade(item.saldo)} {item.unidade}
                    </span>
                    <span className="block text-[11px] text-text-muted">{formatCurrency(item.valorSaldo)}</span>
                  </>
                )}
              </Td>
            </Tr>
          ))}
        </TableBody>
        {itens.length > 1 && (
          <TableFoot>
            <Tr>
              <Td>Total</Td>
              <Td>{formatCurrency(totais.valorOrcado)}</Td>
              <Td>{formatCurrency(totais.valorMedido)}</Td>
              <Td>{formatCurrency(totais.valorSaldo)}</Td>
            </Tr>
          </TableFoot>
        )}
      </Table>
    </div>
  );
}

function MedicoesList({
  planilha,
  onOpen,
  onPdf,
  onAcao,
}: {
  planilha: PlanilhaOrcamento;
  onOpen: (medicao: MedicaoResumo) => void;
  onPdf: (medicao: MedicaoResumo) => void;
  onAcao: (tipo: Acao["tipo"], medicao: MedicaoResumo) => void;
}) {
  const { medicoes, permissoes } = planilha;
  if (medicoes.length === 0) {
    return <EmptyNote>Nenhuma medição lançada ainda.</EmptyNote>;
  }
  const editor = permissoes.editarMedicoes;

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
            const rascunho = m.status === "RASCUNHO";
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
                        label: rascunho && editor ? "Editar" : "Visualizar",
                        icon: rascunho && editor ? Pencil : Eye,
                        onClick: () => onOpen(m),
                      },
                      { label: "Baixar PDF", icon: FileDown, onClick: () => onPdf(m) },
                      {
                        label: "Fechar medição",
                        icon: CheckCircle2,
                        onClick: () => onAcao("fechar", m),
                        hidden: !rascunho || !editor,
                      },
                      { label: "Reabrir", icon: RotateCcw, onClick: () => onAcao("reabrir", m), hidden: !m.podeReabrir },
                      {
                        label: "Excluir rascunho",
                        icon: Trash2,
                        danger: true,
                        onClick: () => onAcao("excluir", m),
                        hidden: !rascunho || !editor,
                      },
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
