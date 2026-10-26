import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { MedicaoDetalhe, PlanilhaOrcamento } from "../../../types/medicao";
import { useMedicoes } from "../../store/medicoes";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import { formatCurrency } from "../../utils/format-currency";
import { formatQuantidade, parseQuantidade, sanitizeDecimalInput, toDecimalInput, valorItem } from "../../utils/decimal";
import { cx } from "../../utils/cx";
import { SearchInput } from "../../components/filters/SearchInput";
import {
  Button,
  ConfirmDialog,
  Field,
  Input,
  SegmentedControl,
  StatusPill,
  Table,
  TableBody,
  TableHead,
  Td,
  Textarea,
  Th,
  Tr,
} from "../../components/ui";
import { todayInput } from "../OrdemServico/ordem-servico-form-utils";
import { medicaoTitulo, toDateInput } from "../OrdemServico/medicao-display";
import { StickyFooter } from "./Workspace";
import { matchesItemSearch } from "./medicao-progress";

const OBSERVACAO_MAX = 2000;

// Linha editável: o máximo é o saldo do item antes desta medição (orçado − medições fechadas)
type Linha = {
  item_id: string;
  codigo: string | null;
  descricao: string;
  unidade: string;
  precoUnitario: number;
  orcado: number;
  anterior: number;
  maximo: number;
};

type Filtro = "todos" | "saldo" | "nesta";

interface MedicaoEditorProps {
  planilha: PlanilhaOrcamento;
  // Rascunho em edição; null = nova medição
  detalhe: MedicaoDetalhe | null;
  // Gravou: a tela vai para a medição (criada agora ou a mesma) e recarrega
  onSaved: (medicaoId: string) => void;
  onDelete?: () => void;
  onPdf?: () => void;
  baixandoPdf?: boolean;
}

/**
 * Medição em edição (nova ou rascunho): período, quanto de cada item foi executado e observações.
 * "Salvar e fechar" grava e fecha na sequência; se o fechamento falhar, o rascunho fica gravado.
 */
export function MedicaoEditor({ planilha, detalhe, onSaved, onDelete, onPdf, baixandoPdf = false }: MedicaoEditorProps) {
  const { createMedicao, updateMedicao, fecharMedicao } = useMedicoes();
  const [inicial] = useState(() => {
    if (detalhe) {
      return {
        periodoInicio: toDateInput(detalhe.periodoInicio),
        periodoFim: toDateInput(detalhe.periodoFim),
        observacao: detalhe.observacao ?? "",
        quantidades: Object.fromEntries(
          detalhe.linhas.filter((l) => l.esta > 0).map((l) => [l.item_id, toDecimalInput(l.esta)]),
        ) as Record<string, string>,
      };
    }
    // Nova: período sugerido (dia seguinte à última fechada, ou início da OS, até hoje)
    const hoje = todayInput();
    const inicio = planilha.proximoPeriodoInicio ? toDateInput(planilha.proximoPeriodoInicio) : hoje;
    return { periodoInicio: inicio, periodoFim: inicio > hoje ? inicio : hoje, observacao: "", quantidades: {} };
  });
  const [periodoInicio, setPeriodoInicio] = useState(inicial.periodoInicio);
  const [periodoFim, setPeriodoFim] = useState(inicial.periodoFim);
  const [observacao, setObservacao] = useState(inicial.observacao);
  const [quantidades, setQuantidades] = useState<Record<string, string>>(inicial.quantidades);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [saving, setSaving] = useState<"rascunho" | "fechar" | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  // Linhas para editar: da medição (rascunho, com o orçamento atual) ou do panorama (nova)
  const linhas: Linha[] = useMemo(() => {
    if (detalhe) {
      return detalhe.linhas.map((l) => ({
        item_id: l.item_id,
        codigo: l.codigo,
        descricao: l.descricao,
        unidade: l.unidade,
        precoUnitario: l.precoUnitario,
        orcado: l.orcado,
        anterior: l.anterior,
        maximo: Math.max(0, Math.round((l.orcado - l.anterior) * 1000) / 1000),
      }));
    }
    return planilha.itens.map((i) => ({
      item_id: i.id,
      codigo: i.codigo,
      descricao: i.descricao,
      unidade: i.unidade,
      precoUnitario: i.precoUnitario,
      orcado: i.quantidade,
      anterior: i.medido,
      maximo: Math.max(0, i.saldo),
    }));
  }, [detalhe, planilha.itens]);

  const numero = detalhe?.numero ?? (planilha.medicoes.at(-1)?.numero ?? 0) + 1;
  const qtd = (item_id: string) => parseQuantidade(quantidades[item_id] ?? "") ?? 0;
  const valorEsta = (l: Linha) =>
    valorItem(l.anterior + qtd(l.item_id), l.precoUnitario) - valorItem(l.anterior, l.precoUnitario);
  const total = linhas.reduce((acc, l) => acc + valorEsta(l), 0);
  const acima = linhas.filter((l) => qtd(l.item_id) > l.maximo);
  const comQuantidade = linhas.filter((l) => qtd(l.item_id) > 0).length;
  const visiveis = linhas.filter(
    (l) =>
      (filtro === "saldo" ? l.maximo > 0 : filtro === "nesta" ? qtd(l.item_id) > 0 : true) &&
      matchesItemSearch(l, busca),
  );

  // Compara o que seria enviado com o carregado (quantidade zerada = linha ausente)
  const snapshot = (q: Record<string, string>, inicio: string, fim: string, obs: string) =>
    JSON.stringify([
      inicio,
      fim,
      obs,
      Object.entries(q)
        .map(([id, v]) => [id, parseQuantidade(v) ?? 0] as const)
        .filter(([, v]) => v > 0)
        .sort(([a], [b]) => a.localeCompare(b)),
    ]);
  const dirty =
    snapshot(quantidades, periodoInicio, periodoFim, observacao) !==
    snapshot(inicial.quantidades, inicial.periodoInicio, inicial.periodoFim, inicial.observacao);
  // Nova medição sem nada lançado não pede confirmação para sair
  const guard = useUnsavedChangesGuard(dirty && (detalhe !== null || comQuantidade > 0 || observacao !== ""));

  const setQuantidade = (item_id: string, valor: string) => {
    setQuantidades((prev) => ({ ...prev, [item_id]: valor }));
    setErro(null);
  };

  function medirTudo() {
    setQuantidades(
      Object.fromEntries(linhas.filter((l) => l.maximo > 0).map((l) => [l.item_id, toDecimalInput(l.maximo)])),
    );
    setErro(null);
  }

  function validar(): string | null {
    if (!periodoInicio || !periodoFim) return "Informe o período da medição.";
    if (periodoInicio > periodoFim) return "O início do período precisa ser antes do fim.";
    if (observacao.length > OBSERVACAO_MAX) return `A observação pode ter até ${OBSERVACAO_MAX} caracteres.`;
    const primeira = acima[0];
    if (primeira) {
      return `"${primeira.descricao}": a quantidade passa do saldo (máx. ${formatQuantidade(primeira.maximo)} ${primeira.unidade}).`;
    }
    if (comQuantidade === 0) return "Informe a quantidade executada de ao menos um item.";
    return null;
  }

  function mostrarErro(texto: string) {
    setErro(texto);
    if (acima.length > 0) {
      setBusca("");
      setFiltro("todos");
      requestAnimationFrame(() => {
        const campo = document.querySelector<HTMLInputElement>('[data-medicao] [aria-invalid="true"]');
        campo?.scrollIntoView({ block: "center" });
        campo?.focus();
      });
    }
  }

  async function salvar(fechar: boolean) {
    const problema = validar();
    if (problema) {
      mostrarErro(problema);
      setConfirmando(false);
      return;
    }
    const dados = {
      periodoInicio,
      periodoFim,
      observacao,
      itens: linhas.filter((l) => qtd(l.item_id) > 0).map((l) => ({ item_id: l.item_id, quantidade: qtd(l.item_id) })),
    };
    setSaving(fechar ? "fechar" : "rascunho");
    let id = detalhe?.id ?? null;
    try {
      if (id) await updateMedicao(id, dados);
      else id = await createMedicao(planilha.ordemServico.id, dados);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar a medição");
      setSaving(null);
      setConfirmando(false);
      return;
    }
    guard.allowNextNavigation();
    if (!fechar) {
      toast.success("Rascunho da medição salvo");
      setSaving(null);
      onSaved(id);
      return;
    }
    try {
      await fecharMedicao(id);
      toast.success(`${medicaoTitulo(numero)} fechada`);
    } catch (err) {
      // O rascunho ficou gravado: a tela abre nele para corrigir e fechar de novo
      toast.error(err instanceof Error ? err.message : "Erro ao fechar a medição");
    } finally {
      setSaving(null);
      setConfirmando(false);
      onSaved(id);
    }
  }

  return (
    <>
      <div data-medicao className="space-y-3 pb-1">
        <div className="bg-surface border border-border rounded-xl p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-[10rem_10rem_minmax(0,1fr)] gap-3 items-start">
          <Field label="Início do período" required>
            <Input type="date" size="sm" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} />
          </Field>
          <Field label="Fim do período" required>
            <Input
              type="date"
              size="sm"
              value={periodoFim}
              min={periodoInicio || undefined}
              onChange={(e) => setPeriodoFim(e.target.value)}
            />
          </Field>
          <Field label="Observações" hint="Saem no boletim de medição.">
            <Textarea rows={1} maxLength={OBSERVACAO_MAX} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </Field>
        </div>

        <div className="flex flex-col lg:flex-row gap-2 lg:items-center">
          <SearchInput value={busca} onChange={setBusca} placeholder="Buscar item por código ou descrição..." />
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl<Filtro>
              label="Itens exibidos"
              value={filtro}
              onChange={setFiltro}
              options={[
                { value: "todos", label: "Todos" },
                { value: "saldo", label: "Com saldo" },
                { value: "nesta", label: `Nesta medição (${comQuantidade})` },
              ]}
            />
            <Button variant="secondary" size="sm" onClick={medirTudo}>
              Medir todo o saldo
            </Button>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHead>
              <Th>Item</Th>
              <Th width="w-32" className="hidden md:table-cell">
                Orçado
              </Th>
              <Th width="w-28" className="hidden lg:table-cell">
                Anterior
              </Th>
              <Th width="w-48">Esta medição</Th>
              <Th width="w-32">Saldo após</Th>
            </TableHead>
            <TableBody>
              {visiveis.map((l) => {
                const esta = qtd(l.item_id);
                const concluido = l.maximo <= 0;
                const excede = esta > l.maximo;
                return (
                  <Tr key={l.item_id} muted={concluido}>
                    <Td>
                      <p className="truncate text-text-primary font-medium" title={l.descricao}>
                        {l.descricao}
                      </p>
                      <p className="text-[11px] text-text-muted truncate">
                        {[l.codigo, `${formatCurrency(l.precoUnitario)}/${l.unidade}`].filter(Boolean).join(" · ")}
                        <span className="md:hidden"> · {formatQuantidade(l.orcado)} {l.unidade} orçados</span>
                      </p>
                    </Td>
                    <Td className="hidden md:table-cell">
                      {formatQuantidade(l.orcado)} {l.unidade}
                    </Td>
                    <Td className="hidden lg:table-cell">{formatQuantidade(l.anterior)}</Td>
                    <Td>
                      {concluido ? (
                        <StatusPill tone="success" size="sm">
                          Concluído
                        </StatusPill>
                      ) : (
                        <div className="w-40 max-w-full mx-auto text-left">
                          <Input
                            size="sm"
                            inputMode="decimal"
                            aria-label={`Quantidade executada de ${l.descricao}`}
                            placeholder="0,00"
                            suffix={l.unidade}
                            invalid={excede}
                            value={quantidades[l.item_id] ?? ""}
                            onChange={(e) => setQuantidade(l.item_id, sanitizeDecimalInput(e.target.value))}
                          />
                          <button
                            type="button"
                            className={cx(
                              "mt-0.5 text-[11px] whitespace-nowrap cursor-pointer hover:underline",
                              excede ? "text-danger-text" : "text-text-muted",
                            )}
                            title="Preencher com todo o saldo do item"
                            onClick={() => setQuantidade(l.item_id, toDecimalInput(l.maximo))}
                          >
                            máx. {formatQuantidade(l.maximo)} · medir saldo
                          </button>
                        </div>
                      )}
                    </Td>
                    <Td>
                      <span className={cx("block", excede ? "text-danger-text font-semibold" : "text-text-primary")}>
                        {formatQuantidade(Math.round((l.maximo - esta) * 1000) / 1000)}
                      </span>
                      {esta > 0 && <span className="block text-[11px] text-text-muted">{formatCurrency(valorEsta(l))}</span>}
                    </Td>
                  </Tr>
                );
              })}
            </TableBody>
          </Table>
          {visiveis.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-text-muted">Nenhum item neste filtro.</p>
          )}
        </div>
      </div>

      <StickyFooter
        summary={
          erro ? (
            <p className="flex items-start gap-1.5 text-sm text-danger-text">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              {erro}
            </p>
          ) : (
            <p className="text-sm text-text-secondary">
              {detalhe ? medicaoTitulo(detalhe.numero) : `Nova medição (será a ${String(numero).padStart(2, "0")})`} ·{" "}
              <span className="font-semibold text-text-primary tabular-nums">{formatCurrency(total)}</span>
              <span className="text-text-muted">
                {" "}
                · {comQuantidade} {comQuantidade === 1 ? "item" : "itens"}
              </span>
            </p>
          )
        }
      >
        {dirty && <span className="text-[11px] text-warning-text">Alterações não salvas</span>}
        {onDelete && (
          <Button variant="ghost" size="sm" icon={Trash2} onClick={onDelete}>
            Excluir rascunho
          </Button>
        )}
        {onPdf && (
          <Button variant="secondary" icon={FileDown} loading={baixandoPdf} onClick={onPdf}>
            PDF do rascunho
          </Button>
        )}
        <Button variant="secondary" loading={saving === "rascunho"} disabled={saving !== null} onClick={() => salvar(false)}>
          Salvar rascunho
        </Button>
        <Button
          icon={CheckCircle2}
          disabled={saving !== null}
          onClick={() => {
            const problema = validar();
            if (problema) mostrarErro(problema);
            else setConfirmando(true);
          }}
        >
          Salvar e fechar
        </Button>
      </StickyFooter>

      <ConfirmDialog
        open={confirmando}
        tone="success"
        title={`Fechar a ${medicaoTitulo(numero)}?`}
        confirmLabel="Fechar medição"
        loading={saving === "fechar"}
        onConfirm={() => salvar(true)}
        onCancel={() => setConfirmando(false)}
      >
        A medição de {formatCurrency(total)} entra no acumulado da OS e fica travada. Para corrigir depois, só a última
        medição fechada pode ser reaberta.
      </ConfirmDialog>
      {guard.dialog}
    </>
  );
}
