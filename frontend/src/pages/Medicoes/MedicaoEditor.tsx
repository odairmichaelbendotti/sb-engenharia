import { Fragment, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { MedicaoDetalhe, PlanilhaOrcamento } from "../../../types/medicao";
import { useMedicoes } from "../../store/medicoes";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import { formatCurrency, formatDateOnly } from "../../utils/format-currency";
import {
  arredondaQtd,
  formatQuantidade,
  parseQuantidade,
  quantidadeEfetiva,
  sanitizeDecimalInput,
  toDecimalInput,
  valorAcumuladoItem,
} from "../../utils/decimal";
import { cx } from "../../utils/cx";
import {
  Button,
  ConfirmDialog,
  Field,
  Input,
  StatTile,
  StatusPill,
  Table,
  TableBody,
  TableGroupRow,
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
import { contagemItens, gruposPorEtapa, SEM_ETAPA, temEtapas, useEtapasRecolhidas } from "./etapas";
import { SupressaoNota, SuprimidoPill } from "./supressao";
import { MedicaoItemFilters } from "./MedicaoItemFilters";
import { correspondeFiltroMedicao, saldoAposMedicao, type FiltroMedicao } from "./medicao-filters";

const OBSERVACAO_MAX = 2000;

// Linha editável: o máximo é o saldo do item antes desta medição (orçado − medições fechadas)
type Linha = {
  item_id: string;
  codigo: string | null;
  descricao: string;
  etapa: string | null;
  unidade: string;
  precoUnitario: number;
  // Quantidade efetiva (contratada − suprimida)
  orcado: number;
  suprimido: number;
  // Total do item (o ajustado, quando há): o item medido por inteiro vale isso
  valorOrcado: number;
  anterior: number;
  maximo: number;
};

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
  const [filtro, setFiltro] = useState<FiltroMedicao>("pendentes");
  // Uma linha concluída permanece enquanto tem foco: não some no meio da digitação.
  const [linhaEmEdicao, setLinhaEmEdicao] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [saving, setSaving] = useState<"rascunho" | "fechar" | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [confirmandoSaldo, setConfirmandoSaldo] = useState(false);

  // Linhas para editar: da medição (rascunho, com o orçamento atual) ou do panorama (nova)
  const linhas: Linha[] = useMemo(() => {
    if (detalhe) {
      return detalhe.linhas.map((l) => ({
        item_id: l.item_id,
        codigo: l.codigo,
        descricao: l.descricao,
        etapa: l.etapa,
        unidade: l.unidade,
        precoUnitario: l.precoUnitario,
        orcado: l.orcado,
        suprimido: l.suprimido ?? 0,
        valorOrcado: l.valorOrcado,
        anterior: l.anterior,
        maximo: Math.max(0, arredondaQtd(l.orcado - l.anterior)),
      }));
    }
    return planilha.itens.map((i) => ({
      item_id: i.id,
      codigo: i.codigo,
      descricao: i.descricao,
      etapa: i.etapa,
      unidade: i.unidade,
      precoUnitario: i.precoUnitario,
      orcado: quantidadeEfetiva(i),
      suprimido: i.quantidadeSuprimida,
      valorOrcado: i.valorTotal,
      anterior: i.medido,
      maximo: Math.max(0, i.saldo),
    }));
  }, [detalhe, planilha.itens]);

  const numero = detalhe?.numero ?? (planilha.medicoes.at(-1)?.numero ?? 0) + 1;
  const qtd = (item_id: string) => parseQuantidade(quantidades[item_id] ?? "") ?? 0;
  const valorEsta = (l: Linha) =>
    Math.round((valorAcumuladoItem(l, l.anterior + qtd(l.item_id)) - valorAcumuladoItem(l, l.anterior)) * 100) / 100;
  const total = linhas.reduce((acc, l) => acc + valorEsta(l), 0);
  const acima = linhas.filter((l) => qtd(l.item_id) > l.maximo);
  const comQuantidade = linhas.filter((l) => qtd(l.item_id) > 0).length;
  const saldo = (l: Linha) => saldoAposMedicao(l.maximo, qtd(l.item_id));
  const pendentes = linhas.filter((l) => saldo(l) > 0).length;
  const totalAnterior = linhas.reduce((acc, l) => acc + valorAcumuladoItem(l, l.anterior), 0);
  const totalRestante = Math.round((linhas.reduce((acc, l) => acc + l.valorOrcado, 0) - totalAnterior - total) * 100) / 100;
  const visiveis = linhas.filter(
    (l) =>
      (correspondeFiltroMedicao({ saldo: saldo(l), esta: qtd(l.item_id) }, filtro) ||
        l.item_id === linhaEmEdicao || qtd(l.item_id) > l.maximo) &&
      matchesItemSearch(l, busca),
  );
  const grupos = gruposPorEtapa(visiveis, (l) => l.etapa);
  const comEtapas = temEtapas(grupos);
  // Com busca ou filtro, as etapas abrem para o resultado aparecer
  const etapas = useEtapasRecolhidas(`${filtro}:${busca}`);

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
    setConfirmandoSaldo(false);
    setFiltro("nesta");
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
      // A etapa do item com erro pode estar recolhida
      const grupo = gruposPorEtapa(linhas, (l) => l.etapa).find((g) => g.itens.includes(acima[0]!));
      if (grupo) etapas.abrir(grupo.key);
      requestAnimationFrame(() => {
        const campo = Array.from(document.querySelectorAll<HTMLInputElement>('[data-medicao] [aria-invalid="true"]'))
          .find((el) => el.getClientRects().length > 0);
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
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-text-primary">
              {detalhe ? medicaoTitulo(numero) : `Nova medição · ${String(numero).padStart(2, "0")}`}
            </h2>
            <StatusPill tone="warning" size="sm">{detalhe ? "Rascunho" : "Ainda não salva"}</StatusPill>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            Informe apenas a quantidade executada neste período. Salve um rascunho para continuar depois ou revise e feche para consolidar.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <StatTile label="Já medido antes" value={formatCurrency(totalAnterior)} hint="Medições anteriores fechadas" />
          <StatTile label="Nesta medição" value={formatCurrency(total)} hint={`${contagemItens(comQuantidade)} com quantidade lançada`} />
          <StatTile label="Falta após esta medição" value={formatCurrency(totalRestante)}
            hint={acima.length ? "Corrija as quantidades acima do saldo" : `${contagemItens(pendentes)} com saldo restante`}
            valueTone={acima.length ? "danger" : pendentes === 0 ? "success" : "default"} />
        </div>
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
          <Field className="col-span-2 sm:col-span-1" label="Observações" hint="Saem no boletim de medição.">
            <Textarea rows={1} maxLength={OBSERVACAO_MAX} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </Field>
        </div>

        <MedicaoItemFilters filtro={filtro} onFiltro={(value) => { setLinhaEmEdicao(null); setFiltro(value); }}
          busca={busca} onBusca={setBusca} pendentes={pendentes} nesta={comQuantidade} todos={linhas.length} visiveis={visiveis.length} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-text-muted">Quantidades em cada unidade do serviço. O valor é calculado automaticamente.</p>
          <Button variant="secondary" size="sm" disabled={!linhas.some((l) => l.maximo > 0)} onClick={() => setConfirmandoSaldo(true)}>
            Preencher todo o saldo…
          </Button>
        </div>

        <div className="hidden md:block bg-surface border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHead>
              <Th>Item</Th>
              <Th width="w-32" className="hidden md:table-cell">
                Orçado
              </Th>
              <Th width="w-28" className="hidden lg:table-cell">
                Já medido
              </Th>
              <Th width="w-48">Esta medição</Th>
              <Th width="w-32">Falta após esta</Th>
            </TableHead>
            <TableBody>
              {grupos.map((grupo) => {
                const aberta = etapas.aberta(grupo.key);
                const valorGrupo = grupo.itens.reduce((acc, l) => acc + valorEsta(l), 0);
                return (
                  <Fragment key={grupo.key}>
                    {comEtapas && (
                      <TableGroupRow
                        columns={[undefined, "hidden md:table-cell", "hidden lg:table-cell", undefined, undefined]}
                        title={grupo.etapa ?? SEM_ETAPA}
                        count={contagemItens(grupo.itens.length)}
                        values={[undefined, undefined, undefined, valorGrupo > 0 ? formatCurrency(valorGrupo) : undefined]}
                        open={aberta}
                        onToggle={() => etapas.alternar(grupo.key)}
                      />
                    )}
                    {aberta &&
                      grupo.itens.map((l) => (
                        <LinhaEditor
                          key={l.item_id}
                          l={l}
                          quantidade={quantidades[l.item_id] ?? ""}
                          esta={qtd(l.item_id)}
                          valorEsta={valorEsta(l)}
                          onChange={(valor) => setQuantidade(l.item_id, valor)}
                          onFocus={() => setLinhaEmEdicao(l.item_id)}
                          onLeave={() => setLinhaEmEdicao(null)}
                        />
                      ))}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="md:hidden space-y-3">
          {grupos.map((grupo) => (
            <div key={grupo.key} className="space-y-2">
              {comEtapas && <h3 className="text-xs font-semibold text-text-secondary">{grupo.etapa ?? SEM_ETAPA} · {contagemItens(grupo.itens.length)}</h3>}
              {grupo.itens.map((l) => (
                <div key={l.item_id} className="bg-surface border border-border rounded-xl p-3 space-y-3"
                  onFocusCapture={() => setLinhaEmEdicao(l.item_id)}
                  onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setLinhaEmEdicao(null); }}>
                  <div>
                    <p className="text-sm font-medium text-text-primary break-words">{l.descricao}</p>
                    <p className="text-xs text-text-muted mt-1">{[l.codigo, `${formatCurrency(l.precoUnitario)}/${l.unidade}`].filter(Boolean).join(" · ")}</p>
                    <SupressaoNota suprimido={l.suprimido} unidade={l.unidade} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                    <p>Orçado: <strong>{formatQuantidade(l.orcado)} {l.unidade}</strong></p>
                    <p>Já medido: <strong>{formatQuantidade(l.anterior)} {l.unidade}</strong></p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 items-start">
                    <div><p className="mb-1 text-xs font-semibold text-text-secondary">Nesta medição ({l.unidade})</p>
                      <QuantidadeMedicao l={l} quantidade={quantidades[l.item_id] ?? ""} esta={qtd(l.item_id)} onChange={(v) => setQuantidade(l.item_id, v)} />
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-secondary">Falta após esta</p>
                      <p className={cx("mt-1 font-semibold text-sm tabular-nums", saldo(l) < 0 ? "text-danger-text" : "text-text-primary")}>
                        {formatQuantidade(saldo(l))} {l.unidade}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">Valor nesta: {formatCurrency(valorEsta(l))}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        {visiveis.length === 0 && (
          <div className="rounded-xl border border-border bg-surface px-4 py-6 text-center space-y-2">
            <p className="text-sm font-medium text-text-primary">
              {busca.trim() ? "Nenhum item corresponde à busca neste filtro." : filtro === "pendentes" ? "Não há saldo restante a medir." : filtro === "nesta" ? "Nenhum item lançado nesta medição." : "Nenhum item no orçamento."}
            </p>
            <Button variant="secondary" size="sm" onClick={() => { setBusca(""); setFiltro("todos"); }}>Ver todos os itens</Button>
          </div>
        )}
      </div>

      <StickyFooter
        summary={
          erro ? (
            <p role="alert" className="flex items-start gap-1.5 text-sm text-danger-text">
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
          Revisar e fechar
        </Button>
      </StickyFooter>

      <ConfirmDialog
        open={confirmandoSaldo} tone="neutral" title="Preencher todo o saldo disponível?"
        confirmLabel="Preencher todos os itens" onConfirm={medirTudo} onCancel={() => setConfirmandoSaldo(false)}>
        Isso preenche todos os itens do orçamento com o saldo disponível antes desta medição, inclusive os que estão fora da busca ou do filtro.
        As quantidades já digitadas serão substituídas. Nada será salvo ou fechado até você confirmar essas ações.
      </ConfirmDialog>
      <ConfirmDialog
        open={confirmando}
        tone="success"
        title={`Fechar a ${medicaoTitulo(numero)}?`}
        confirmLabel="Fechar medição"
        loading={saving === "fechar"}
        onConfirm={() => salvar(true)}
        onCancel={() => setConfirmando(false)}
      >
        <span className="block mb-2">
          Período: {formatDateOnly(periodoInicio)} a {formatDateOnly(periodoFim)} · {contagemItens(comQuantidade)}.
        </span>
        <span className="block mb-2 font-semibold">Total desta medição: {formatCurrency(total)}.</span>
        <span className="block mb-2">Falta após esta medição: {formatCurrency(totalRestante)} em {contagemItens(pendentes)}.</span>
        Ao confirmar, os lançamentos entram no acumulado da OS e ficam travados. Para corrigir depois, só a última
        medição fechada pode ser reaberta.
      </ConfirmDialog>
      {guard.dialog}
    </>
  );
}

interface LinhaEditorProps {
  l: Linha;
  quantidade: string;
  esta: number;
  valorEsta: number;
  onChange: (valor: string) => void;
  onFocus: () => void;
  onLeave: () => void;
}

// Item da medição em edição: quanto foi executado, até o saldo
function LinhaEditor({ l, quantidade, esta, valorEsta, onChange, onFocus, onLeave }: LinhaEditorProps) {
  const concluido = l.maximo <= 0;
  const excede = esta > l.maximo;
  return (
    <Tr muted={concluido} onFocusCapture={onFocus}
      onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) onLeave(); }}>
      <Td>
        <p className="line-clamp-2 text-text-primary font-medium" title={l.descricao}>
          {l.descricao}
        </p>
        <p className="text-[11px] text-text-muted truncate">
          {[l.codigo, `${formatCurrency(l.precoUnitario)}/${l.unidade}`].filter(Boolean).join(" · ")}
          <span className="md:hidden"> · {formatQuantidade(l.orcado)} {l.unidade} orçados</span>
          {l.suprimido > 0 && (
            <span className="md:hidden text-danger-text"> · −{formatQuantidade(l.suprimido)} suprimido</span>
          )}
        </p>
      </Td>
      <Td className="hidden md:table-cell">
        {formatQuantidade(l.orcado)} {l.unidade}
        <SupressaoNota suprimido={l.suprimido} />
      </Td>
      <Td className="hidden lg:table-cell">{formatQuantidade(l.anterior)}</Td>
      <Td>
        <QuantidadeMedicao l={l} quantidade={quantidade} esta={esta} onChange={onChange} />
      </Td>
      <Td>
        <span className={cx("block", excede ? "text-danger-text font-semibold" : "text-text-primary")}>
          {formatQuantidade(saldoAposMedicao(l.maximo, esta))} {l.unidade}
        </span>
        {esta > 0 && <span className="block text-[11px] text-text-muted">Valor nesta: {formatCurrency(valorEsta)}</span>}
      </Td>
    </Tr>
  );
}

function QuantidadeMedicao({ l, quantidade, esta, onChange }: Pick<LinhaEditorProps, "l" | "quantidade" | "esta" | "onChange">) {
  const excede = esta > l.maximo;
  return l.orcado === 0 && l.suprimido > 0 ? (
          <SuprimidoPill />
        ) : l.maximo <= 0 ? (
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
              value={quantidade}
              onChange={(e) => onChange(sanitizeDecimalInput(e.target.value))}
            />
            <button
              type="button"
              className={cx(
                "mt-0.5 text-[11px] whitespace-nowrap cursor-pointer hover:underline",
                excede ? "text-danger-text" : "text-text-muted",
              )}
              title="Preencher com todo o saldo do item"
              onClick={() => onChange(toDecimalInput(l.maximo))}
            >
              Usar saldo: {formatQuantidade(l.maximo)} {l.unidade}
            </button>
            {excede && <p className="mt-1 text-xs text-danger-text">Quantidade acima do saldo disponível.</p>}
          </div>
        );
}
