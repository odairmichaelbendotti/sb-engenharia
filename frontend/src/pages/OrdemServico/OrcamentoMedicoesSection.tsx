import { useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, Eye, FileDown, Ruler } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import type { MedicaoResumo, PlanilhaOrcamento } from "../../../types/medicao";
import { useMedicoes } from "../../store/medicoes";
import { usePermission } from "../../hooks/usePermission";
import { formatCurrency, formatDateOnly } from "../../utils/format-currency";
import { downloadBlob } from "../../utils/download-file";
import { cx } from "../../utils/cx";
import { ActionMenu, Button, FormSection, StatusPill, Table, TableBody, TableHead, Td, Th, Tr } from "../../components/ui";
import { EmptyNote } from "../../components/EntityViewer/ViewFrame";
import { MedicaoLeituraModal } from "./MedicaoLeituraModal";
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
  const { fetchPlanilha, fetchMedicaoDocument } = useMedicoes();
  const { canViewEngenharia, isEmpresaRestricted } = usePermission();
  const navigate = useNavigate();
  const [planilha, setPlanilha] = useState<PlanilhaOrcamento | null>(null);
  const [error, setError] = useState(false);
  // Medição aberta em leitura (para quem não tem a tela Medições)
  const [lendo, setLendo] = useState<string | null>(null);
  const temTela = canViewEngenharia && !isEmpresaRestricted;

  // Pedido de nova tentativa depois de um erro
  const [tentativa, setTentativa] = useState(0);

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
      {itens.length === 0 ? (
        <EmptyNote>
          {permissoes.editarOrcamento
            ? "Nenhum orçamento lançado. Lance os itens do serviço na tela Medições para começar a medir."
            : "Nenhum orçamento lançado nesta OS."}
        </EmptyNote>
      ) : (
        <>
          <MedicaoResumoBar planilha={planilha} />
          <MedicoesList planilha={planilha} editaNaTela={temTela} onOpen={abrir} onPdf={baixarPdf} />
        </>
      )}

      {lendo && <MedicaoLeituraModal medicaoId={lendo} numeroOs={numero} onClose={() => setLendo(null)} />}
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
