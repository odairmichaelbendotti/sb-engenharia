import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardPaste, Lock, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { OrcamentoItem, OrcamentoPayload, PlanilhaOrcamento, PrecoBase } from "../../../types/medicao";
import { useMedicoes } from "../../store/medicoes";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import { formatCurrency } from "../../utils/format-currency";
import { formatValueToCurrencyMask, maskCurrency, parseCurrencyMask } from "../../utils/masks";
import {
  folgaValorTotal,
  formatQuantidade,
  parseQuantidade,
  precoComDesconto,
  sanitizeDecimalInput,
  toDecimalInput,
  valorItem,
} from "../../utils/decimal";
import { ORDEM_SERVICO_ITEM_FIELD_RULES } from "../../utils/normalization/form-rules";
import { cx } from "../../utils/cx";
import { SearchInput } from "../../components/filters/SearchInput";
import { Button, ConfirmDialog, IconButton, InlineEdit, Input, SegmentedControl } from "../../components/ui";
import { StickyFooter } from "./Workspace";
import { matchesItemSearch } from "./medicao-progress";
import { ORCAMENTO_ITENS_MAX, type PastedItem } from "./parse-pasted-budget";
import { PasteOrcamentoDialog, type PasteMode } from "./PasteOrcamentoDialog";

type ItemForm = {
  key: number;
  id?: string;
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade: string;
  // Como informado: com BDI (o sistema aplica o desconto) ou já com desconto, conforme o modo
  preco: string;
  // Total ajustado (máscara de moeda) para bater com a planilha de referência; null = qtd × preço.
  // Só no modo com desconto
  total: string | null;
  // Soma das medições fechadas: trava preço e unidade e é o mínimo da quantidade
  medido: number;
};

type Campo = "codigo" | "descricao" | "unidade" | "quantidade" | "preco" | "total" | "empenhos";
type Erro = { key: number | null; campo: Campo | null; texto: string };

const PRECO_BASE_OPTIONS: { value: PrecoBase; label: string }[] = [
  { value: "COM_BDI", label: "Preços com BDI" },
  { value: "COM_BDI_E_DESCONTO", label: "Preços com BDI e desconto" },
];

// Até lg a linha vira cartão; a coluna "Medido" só cabe a partir de xl
const COLS =
  "lg:grid-cols-[1.5rem_5.5rem_minmax(0,1fr)_4.5rem_6.5rem_8rem_7rem_2rem] xl:grid-cols-[1.5rem_6rem_minmax(0,1fr)_4.5rem_7rem_8.5rem_7.5rem_7rem_2rem]";

function toForm(item: OrcamentoItem, key: number): ItemForm {
  return {
    key,
    id: item.id,
    codigo: item.codigo ?? "",
    descricao: item.descricao,
    unidade: item.unidade,
    quantidade: toDecimalInput(item.quantidade),
    // No modo com BDI o campo mostra o preço informado (referência); o que vale sai dele com o desconto
    preco: formatValueToCurrencyMask(item.precoReferencia ?? item.precoUnitario),
    total: item.totalAjustado ? formatValueToCurrencyMask(item.valorTotal) : null,
    medido: item.medido,
  };
}

const preenchida = (l: ItemForm) => Boolean(l.id || l.descricao || l.unidade || l.quantidade || l.preco);

// Diferença em reais, com sinal ("+R$ 0,01")
function formatDiferenca(valor: number) {
  return `${valor > 0 ? "+" : "−"}${formatCurrency(Math.abs(valor))}`;
}

function formatPercentual(valor: number) {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }).format(valor)}%`;
}

const centavos = (valor: number) => Math.round(valor * 100);

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

interface OrcamentoEditorProps {
  planilha: PlanilhaOrcamento;
  onSaved: () => void;
}

/**
 * Planilha orçamentária da OS em tela cheia: é a base de preço da OS (o valor dela é a soma dos
 * itens). Os preços podem vir só com BDI (o sistema aplica o desconto da OS, truncando o centavo)
 * ou já com desconto. Item medido trava preço e unidade, não sai e tem quantidade mínima. No modo
 * com desconto o total pode ser ajustado à planilha de referência, dentro da folga do backend; item
 * medido por inteiro trava o total. Os campos só viram input ao clicar (InlineEdit).
 */
export function OrcamentoEditor({ planilha, onSaved }: OrcamentoEditorProps) {
  const { itens, valorOs, ordemServico, desconto, empenhos, permissoes } = planilha;
  const saveOrcamento = useMedicoes((s) => s.saveOrcamento);
  const emitirOrdemServico = useMedicoes((s) => s.emitirOrdemServico);
  const nextKey = useRef(0);
  const novaLinha = (patch: Partial<ItemForm> = {}): ItemForm => ({
    key: nextKey.current++,
    codigo: "",
    descricao: "",
    unidade: "",
    quantidade: "",
    preco: "",
    total: null,
    medido: 0,
    ...patch,
  });
  const [linhas, setLinhas] = useState<ItemForm[]>(() =>
    itens.length > 0 ? itens.map((item) => toForm(item, nextKey.current++)) : [novaLinha()],
  );
  const [precoBase, setPrecoBase] = useState<PrecoBase>(planilha.precoBase);
  // Quanto cada empenho destina à OS (máscara de moeda), quando ela tem mais de um
  const [distribuicao, setDistribuicao] = useState<Record<string, string>>(() =>
    Object.fromEntries(empenhos.map((e) => [e.id, formatValueToCurrencyMask(e.valor)])),
  );
  const serialize = () =>
    JSON.stringify([
      precoBase,
      linhas
        .filter(preenchida)
        .map((l) => [l.id ?? null, l.codigo, l.descricao, l.unidade, l.quantidade, l.preco, l.total]),
      empenhos.length > 1 ? distribuicao : null,
    ]);
  const [inicial] = useState(serialize);
  const [erro, setErro] = useState<Erro | null>(null);
  const [saving, setSaving] = useState(false);
  const [emitindo, setEmitindo] = useState<"confirmar" | "enviando" | null>(null);
  const [busca, setBusca] = useState("");
  // null = fechado; texto = colado direto na tela (vazio abre com o campo)
  const [colando, setColando] = useState<string | null>(null);

  const dirty = serialize() !== inicial;
  const guard = useUnsavedChangesGuard(dirty);
  const aplicaDesconto = precoBase === "COM_BDI";

  // Ctrl+V fora de um campo: se o texto tem colunas (tabulação), abre a prévia da colagem
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (isEditableTarget(event.target) || colando !== null) return;
      const text = event.clipboardData?.getData("text/plain") ?? "";
      if (!text.includes("\t")) return;
      event.preventDefault();
      setColando(text);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [colando]);

  // Preço que vale nas medições: o informado, com o desconto da OS no modo com BDI
  const precoEfetivo = (l: ItemForm) => {
    const informado = parseCurrencyMask(l.preco);
    return aplicaDesconto ? precoComDesconto(informado, desconto) : informado;
  };
  // Quantidade × preço que vale, sem o ajuste
  const totalCalculado = (l: ItemForm) => {
    const quantidade = parseQuantidade(l.quantidade);
    return quantidade === null ? 0 : valorItem(quantidade, precoEfetivo(l));
  };
  const totalLinha = (l: ItemForm) =>
    l.total === null || aplicaDesconto ? totalCalculado(l) : parseCurrencyMask(l.total);

  const update = (key: number, patch: Partial<ItemForm>) => {
    setLinhas((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
    if (erro?.key === key) setErro(null);
  };

  const normalizar = (key: number, campo: "codigo" | "descricao" | "unidade") => {
    const normalize = ORDEM_SERVICO_ITEM_FIELD_RULES[campo];
    setLinhas((prev) => prev.map((l) => (l.key === key && normalize ? { ...l, [campo]: normalize(l[campo]) } : l)));
  };

  function trocarPrecoBase(novo: PrecoBase) {
    setPrecoBase(novo);
    // O total ajustado é da planilha com desconto: aplicando o desconto, o total é sempre o calculado
    if (novo === "COM_BDI") setLinhas((prev) => prev.map((l) => (l.total === null ? l : { ...l, total: null })));
    setErro(null);
  }

  const total = linhas.reduce((acc, l) => acc + totalLinha(l), 0);
  // Total com BDI: pelo preço informado no modo com BDI; sem o desconto, no modo já descontado
  const totalComBdi = aplicaDesconto
    ? linhas.reduce((acc, l) => {
        const quantidade = parseQuantidade(l.quantidade);
        return acc + (quantidade === null ? 0 : valorItem(quantidade, parseCurrencyMask(l.preco)));
      }, 0)
    : desconto < 100
      ? Math.round((total / (1 - desconto / 100)) * 100) / 100
      : total;
  const valorMuda = valorOs !== null && centavos(total) !== centavos(valorOs);
  const medidos = linhas.filter((l) => l.medido > 0).length;
  const somaDistribuida = empenhos.reduce((acc, e) => acc + parseCurrencyMask(distribuicao[e.id] ?? ""), 0);
  const visiveis = useMemo(
    () =>
      linhas
        .map((l, index) => ({ l, index }))
        // Linha nova (ainda sem texto) aparece mesmo com busca, para não sumir ao ser adicionada
        .filter(({ l }) => (!l.codigo && !l.descricao) || matchesItemSearch(l, busca)),
    [linhas, busca],
  );

  // Primeiro problema, na ordem da planilha (a mensagem aponta o item)
  function validar(): Erro | null {
    const cheias = linhas.filter(preenchida);
    if (cheias.length === 0) {
      return { key: linhas[0]?.key ?? null, campo: "descricao", texto: "Inclua ao menos um item no orçamento." };
    }
    if (cheias.length > ORCAMENTO_ITENS_MAX) {
      return { key: null, campo: null, texto: `O orçamento aceita até ${ORCAMENTO_ITENS_MAX} itens.` };
    }
    for (const [index, l] of linhas.entries()) {
      if (!preenchida(l)) continue;
      const pos = `Item ${index + 1}`;
      if (!l.descricao.trim()) return { key: l.key, campo: "descricao", texto: `${pos}: informe a descrição do serviço.` };
      if (!l.unidade.trim()) return { key: l.key, campo: "unidade", texto: `${pos}: informe a unidade (m², m³, un...).` };
      const quantidade = parseQuantidade(l.quantidade);
      if (quantidade === null || quantidade <= 0) {
        return { key: l.key, campo: "quantidade", texto: `${pos}: a quantidade precisa ser maior que zero.` };
      }
      if (quantidade < l.medido) {
        return {
          key: l.key,
          campo: "quantidade",
          texto: `${pos}: já foram medidos ${formatQuantidade(l.medido)} ${l.unidade}; a quantidade não pode ficar abaixo disso.`,
        };
      }
      if (!l.preco) return { key: l.key, campo: "preco", texto: `${pos}: informe o preço unitário.` };
      if (l.total !== null && !aplicaDesconto) {
        if (!l.total) return { key: l.key, campo: "total", texto: `${pos}: informe o total ou use o calculado.` };
        const folga = folgaValorTotal(quantidade);
        if (Math.abs(parseCurrencyMask(l.total) - totalCalculado(l)) > folga + 1e-9) {
          return {
            key: l.key,
            campo: "total",
            texto: `${pos}: o total ajustado pode diferir de quantidade × preço (${formatCurrency(totalCalculado(l))}) em até ${formatCurrency(folga)}. Confira os valores.`,
          };
        }
      }
    }
    if (empenhos.length > 1) {
      if (centavos(somaDistribuida) !== centavos(total)) {
        return {
          key: null,
          campo: "empenhos",
          texto: `Os empenhos somam ${formatCurrency(somaDistribuida)}; precisam somar o valor do orçamento (${formatCurrency(total)}).`,
        };
      }
      const acima = empenhos.find((e) => parseCurrencyMask(distribuicao[e.id] ?? "") > e.saldoLivre + 1e-9);
      if (acima) {
        return {
          key: null,
          campo: "empenhos",
          texto: `O empenho ${acima.numero} tem ${formatCurrency(acima.saldoLivre)} livres para esta OS.`,
        };
      }
    } else if (empenhos[0] && total > empenhos[0].saldoLivre + 1e-9) {
      return {
        key: null,
        campo: null,
        texto: `O orçamento (${formatCurrency(total)}) passa do saldo livre do empenho ${empenhos[0].numero} (${formatCurrency(empenhos[0].saldoLivre)}).`,
      };
    }
    return null;
  }

  function mostrarErro(problema: Erro) {
    setErro(problema);
    // O item com erro pode estar escondido pela busca: limpa e leva até ele
    if (problema.key !== null) setBusca("");
    requestAnimationFrame(() => {
      const campo = document.querySelector<HTMLInputElement>('[data-orcamento] [aria-invalid="true"]');
      campo?.scrollIntoView({ block: "center" });
      campo?.focus();
    });
  }

  async function handleSave() {
    const problema = validar();
    if (problema) {
      mostrarErro(problema);
      return;
    }
    const payload: OrcamentoPayload = {
      precoBase,
      itens: linhas.filter(preenchida).map((l) => ({
        ...(l.id ? { id: l.id } : {}),
        codigo: l.codigo,
        descricao: l.descricao,
        unidade: l.unidade,
        quantidade: parseQuantidade(l.quantidade) ?? 0,
        precoUnitario: parseCurrencyMask(l.preco),
        valorTotal: l.total === null || aplicaDesconto ? null : parseCurrencyMask(l.total),
      })),
      ...(empenhos.length > 1
        ? {
            empenhos: empenhos.map((e) => ({
              empenho_id: e.id,
              valor: parseCurrencyMask(distribuicao[e.id] ?? ""),
            })),
          }
        : {}),
    };
    setSaving(true);
    try {
      const { reemitida } = await saveOrcamento(ordemServico.id, payload);
      toast.success(
        reemitida
          ? "Orçamento salvo e OS reemitida: a empresa precisa dar ciência de novo."
          : ordemServico.aguardandoEmissao
            ? "Orçamento salvo. Confira e emita a OS para a empresa."
            : "Orçamento salvo",
      );
      guard.allowNextNavigation();
      onSaved();
    } catch (err) {
      setErro({ key: null, campo: null, texto: err instanceof Error ? err.message : "Erro ao salvar o orçamento" });
    } finally {
      setSaving(false);
    }
  }

  async function handleEmitir() {
    setEmitindo("enviando");
    try {
      await emitirOrdemServico(ordemServico.id);
      toast.success("OS emitida: a empresa tem 48 horas para dar ciência.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao emitir a ordem de serviço");
    } finally {
      setEmitindo(null);
    }
  }

  function aplicarColagem(novos: PastedItem[], mode: PasteMode) {
    const linhasNovas = novos.map((item) =>
      novaLinha({
        codigo: item.codigo,
        descricao: item.descricao,
        unidade: item.unidade,
        quantidade: toDecimalInput(item.quantidade),
        preco: formatValueToCurrencyMask(item.precoUnitario),
        // Aplicando o desconto, o total da planilha (com BDI) não vale para o item
        total: item.valorTotal === null || aplicaDesconto ? null : formatValueToCurrencyMask(item.valorTotal),
      }),
    );
    setLinhas((prev) => {
      // "Substituir" mantém os itens já medidos (esses não podem sair do orçamento)
      const base = mode === "replace" ? prev.filter((l) => l.medido > 0) : prev.filter(preenchida);
      return [...base, ...linhasNovas];
    });
    setErro(null);
    setBusca("");
    setColando(null);
    toast.success(`${novos.length} ${novos.length === 1 ? "item incluído" : "itens incluídos"} na planilha. Confira e salve.`);
  }

  const invalido = (l: ItemForm, campo: Campo) => erro?.key === l.key && erro.campo === campo;

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <SegmentedControl
            label="Como os preços foram informados"
            options={PRECO_BASE_OPTIONS}
            value={precoBase}
            onChange={trocarPrecoBase}
            disabled={!permissoes.trocarPrecoBase}
          />
          <span className="text-[11px] text-text-muted">
            {!permissoes.trocarPrecoBase
              ? "Modo travado: já há medição fechada com estes preços."
              : aplicaDesconto
                ? `O sistema aplica o desconto de ${formatPercentual(desconto)} da OS em cada preço (truncado no centavo).`
                : "Os preços já valem como informados."}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 lg:ml-auto lg:w-auto">
          <SearchInput value={busca} onChange={setBusca} placeholder="Buscar item por código ou descrição..." />
          <Button variant="secondary" size="sm" icon={ClipboardPaste} onClick={() => setColando("")}>
            Colar do Excel
          </Button>
        </div>
      </div>

      <div data-orcamento className="bg-surface border border-border rounded-xl p-3 sm:p-4 space-y-3">
        <div
          className={cx(
            "hidden lg:grid gap-2 px-0.5 text-[11px] font-semibold uppercase tracking-wide text-text-secondary",
            COLS,
          )}
        >
          <span>#</span>
          <span>Código</span>
          <span>Descrição do serviço</span>
          <span>Un</span>
          <span className="text-right">Quantidade</span>
          <span className="text-right">{aplicaDesconto ? "Preço c/ BDI" : "Preço unit."}</span>
          <span className="text-right">Total</span>
          <span className="hidden xl:block text-right">Medido</span>
          <span />
        </div>

        <div className="space-y-3 lg:space-y-1">
          {visiveis.map(({ l, index }) => {
            const medido = l.medido > 0;
            // Medido por inteiro: a última medição já usou o total, que não muda mais
            const totalTravado = medido && l.medido >= (parseQuantidade(l.quantidade) ?? 0);
            const ajustado = l.total !== null && !aplicaDesconto;
            const calculadoMask = formatValueToCurrencyMask(totalCalculado(l));
            const diferencaTotal = ajustado ? Math.round((totalLinha(l) - totalCalculado(l)) * 100) / 100 : 0;
            return (
              <div key={l.key} className="rounded-lg border border-border p-2.5 lg:border-0 lg:p-0">
                <div className={cx("grid grid-cols-2 sm:grid-cols-4 gap-2 items-start", COLS)}>
                  <span className="hidden lg:flex h-8 items-center justify-center text-xs text-text-muted tabular-nums">
                    {index + 1}
                  </span>
                  <InlineEdit
                    size="sm"
                    aria-label={`Código do item ${index + 1}`}
                    placeholder="Código"
                    value={l.codigo}
                    optional
                    display={l.codigo || <span className="text-text-muted">—</span>}
                    maxLength={40}
                    onChange={(e) => update(l.key, { codigo: e.target.value })}
                    onRevert={(codigo) => update(l.key, { codigo })}
                    onBlur={() => normalizar(l.key, "codigo")}
                  />
                  <InlineEdit
                    size="sm"
                    className="col-span-2 sm:col-span-3 lg:col-span-1"
                    aria-label={`Descrição do item ${index + 1}`}
                    placeholder="Descrição do serviço (ex.: execução de reboco)"
                    title={l.descricao}
                    value={l.descricao}
                    maxLength={500}
                    invalid={invalido(l, "descricao")}
                    onChange={(e) => update(l.key, { descricao: e.target.value })}
                    onRevert={(descricao) => update(l.key, { descricao })}
                    onBlur={() => normalizar(l.key, "descricao")}
                  />
                  <InlineEdit
                    size="sm"
                    aria-label={`Unidade do item ${index + 1}`}
                    placeholder="m²"
                    value={l.unidade}
                    maxLength={20}
                    disabled={medido}
                    title={medido ? "Item já medido: a unidade não muda" : undefined}
                    invalid={invalido(l, "unidade")}
                    onChange={(e) => update(l.key, { unidade: e.target.value })}
                    onRevert={(unidade) => update(l.key, { unidade })}
                    onBlur={() => normalizar(l.key, "unidade")}
                  />
                  <InlineEdit
                    size="sm"
                    align="right"
                    aria-label={`Quantidade do item ${index + 1}`}
                    inputMode="decimal"
                    placeholder="0,00"
                    value={l.quantidade}
                    display={
                      parseQuantidade(l.quantidade) !== null
                        ? formatQuantidade(parseQuantidade(l.quantidade)!)
                        : l.quantidade
                    }
                    invalid={invalido(l, "quantidade")}
                    onChange={(e) => update(l.key, { quantidade: sanitizeDecimalInput(e.target.value) })}
                    onRevert={(quantidade) => update(l.key, { quantidade })}
                  />
                  <div className="min-w-0">
                    <InlineEdit
                      size="sm"
                      align="right"
                      aria-label={`Preço unitário ${aplicaDesconto ? "com BDI " : ""}do item ${index + 1}`}
                      inputMode="numeric"
                      prefix="R$"
                      placeholder="0,00"
                      value={l.preco}
                      disabled={medido}
                      title={medido ? "Item já medido: o preço não muda" : undefined}
                      invalid={invalido(l, "preco")}
                      onChange={(e) => update(l.key, { preco: maskCurrency(e.target.value) })}
                      onRevert={(preco) => update(l.key, { preco })}
                    />
                    {aplicaDesconto && l.preco && (
                      <p
                        className="mt-0.5 pr-2.5 text-right text-[11px] text-text-muted tabular-nums truncate"
                        title="Preço que vale nas medições: com o desconto da OS, truncado no centavo"
                      >
                        c/ desc. {formatCurrency(precoEfetivo(l))}
                      </p>
                    )}
                  </div>
                  {aplicaDesconto ? (
                    <span className="flex h-8 items-center justify-end px-2.5 text-xs font-semibold text-text-primary tabular-nums truncate">
                      {formatCurrency(totalLinha(l))}
                    </span>
                  ) : (
                    <InlineEdit
                      size="sm"
                      align="right"
                      aria-label={`Total ajustado do item ${index + 1}`}
                      inputMode="numeric"
                      placeholder="0,00"
                      value={l.total ?? calculadoMask}
                      display={<span className="font-semibold">{formatCurrency(totalLinha(l))}</span>}
                      disabled={totalTravado}
                      title={
                        totalTravado
                          ? "Item medido por inteiro: o total não muda mais"
                          : "Ajustar o total para bater com a planilha de referência"
                      }
                      invalid={invalido(l, "total")}
                      onChange={(e) => update(l.key, { total: maskCurrency(e.target.value) })}
                      onRevert={(anterior) => update(l.key, { total: anterior === calculadoMask ? null : anterior })}
                    />
                  )}
                  <span
                    className={cx(
                      "hidden xl:flex h-8 items-center justify-end text-xs tabular-nums truncate",
                      medido ? "text-text-secondary" : "text-text-muted",
                    )}
                    title={medido ? `${formatQuantidade(l.medido)} ${l.unidade} medidos em medições fechadas` : undefined}
                  >
                    {medido ? `${formatQuantidade(l.medido)} ${l.unidade}` : "—"}
                  </span>
                  <div className="flex justify-end">
                    <IconButton
                      icon={Trash2}
                      label={medido ? "Item já medido: não pode ser removido" : `Remover item ${index + 1}`}
                      variant="danger"
                      disabled={medido || (linhas.length === 1 && itens.length === 0)}
                      onClick={() => setLinhas((prev) => prev.filter((x) => x.key !== l.key))}
                    />
                  </div>
                </div>
                {medido && (
                  <p className="mt-1 lg:pl-8 flex items-center gap-1 text-[11px] text-text-muted">
                    <Lock size={11} />
                    Medido {formatQuantidade(l.medido)} {l.unidade}: preço e unidade travados, quantidade mínima{" "}
                    {formatQuantidade(l.medido)}
                  </p>
                )}
                {ajustado && (
                  <p className="mt-1 lg:pl-8 flex flex-wrap items-center gap-x-1 text-[11px] text-text-muted tabular-nums">
                    Total ajustado à planilha: calculado {formatCurrency(totalCalculado(l))}
                    {diferencaTotal !== 0 && ` (${formatDiferenca(diferencaTotal)})`}
                    {!totalTravado && (
                      <>
                        {" · "}
                        <button
                          type="button"
                          className="font-semibold text-text-secondary underline-offset-2 hover:underline cursor-pointer"
                          onClick={() => update(l.key, { total: null })}
                        >
                          Usar o calculado
                        </button>
                      </>
                    )}
                  </p>
                )}
              </div>
            );
          })}
          {visiveis.length === 0 && (
            <p className="py-6 text-center text-sm text-text-muted">Nenhum item encontrado para “{busca}”.</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setBusca("");
              setLinhas((prev) => [...prev, novaLinha()]);
            }}
          >
            Adicionar item
          </Button>
          <span className="text-[11px] text-text-muted">
            Dica: clique num valor para editar; copie as linhas no Excel e cole (Ctrl+V) em qualquer ponto fora de
            um campo.
          </span>
        </div>

        {empenhos.length > 1 && (
          <div className="border-t border-border pt-3 space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="text-xs font-semibold text-text-secondary">Valor por empenho</p>
              <p
                className={cx(
                  "text-[11px] tabular-nums",
                  centavos(somaDistribuida) === centavos(total) ? "text-text-muted" : "text-warning-text",
                )}
              >
                Soma {formatCurrency(somaDistribuida)} de {formatCurrency(total)}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {empenhos.map((e) => (
                <div key={e.id} className="flex items-center gap-2 min-w-0">
                  <span className="w-28 shrink-0 truncate text-xs text-text-primary" title={e.numero}>
                    {e.numero}
                  </span>
                  <Input
                    size="sm"
                    className="flex-1 min-w-0"
                    aria-label={`Valor do empenho ${e.numero} nesta OS`}
                    inputMode="numeric"
                    prefix="R$"
                    value={distribuicao[e.id] ?? ""}
                    invalid={erro?.campo === "empenhos"}
                    onChange={(ev) => {
                      setDistribuicao((prev) => ({ ...prev, [e.id]: maskCurrency(ev.target.value) }));
                      if (erro?.campo === "empenhos") setErro(null);
                    }}
                  />
                  <span className="hidden sm:block w-24 shrink-0 text-right text-[11px] text-text-muted tabular-nums truncate">
                    livre {formatCurrency(e.saldoLivre)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <StickyFooter
        summary={
          erro ? (
            <p className="flex items-start gap-1.5 text-sm text-danger-text">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              {erro.texto}
            </p>
          ) : (
            <>
              <p className="text-sm text-text-secondary">
                Valor da OS <span className="font-semibold text-text-primary tabular-nums">{formatCurrency(total)}</span>
                <span className="text-text-muted tabular-nums">
                  {" "}
                  · com BDI {formatCurrency(totalComBdi)} · desconto {formatPercentual(desconto)} ·{" "}
                  {linhas.filter(preenchida).length} itens{medidos > 0 ? ` · ${medidos} já medidos` : ""}
                </span>
              </p>
              {valorOs !== null && (
                <p
                  className={cx(
                    "flex items-center gap-1 text-xs tabular-nums mt-0.5",
                    !valorMuda ? "text-success-text" : permissoes.reemiteAoMudarValor ? "text-warning-text" : "text-text-muted",
                  )}
                >
                  {!valorMuda ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                  {!valorMuda
                    ? "Confere com o valor da OS"
                    : `Ao salvar, o valor da OS passa de ${formatCurrency(valorOs)} para ${formatCurrency(total)}${
                        permissoes.reemiteAoMudarValor ? " e a OS é reemitida para a empresa" : ""
                      }`}
                </p>
              )}
            </>
          )
        }
      >
        {dirty && <span className="text-[11px] text-warning-text">Alterações não salvas</span>}
        {permissoes.emitir && !dirty && (
          <Button variant="secondary" icon={Send} onClick={() => setEmitindo("confirmar")}>
            Emitir OS
          </Button>
        )}
        {/* Sem edição, salvar ainda serve para acertar o valor da OS com o orçamento */}
        <Button loading={saving} disabled={!dirty && itens.length > 0 && !valorMuda} onClick={handleSave}>
          Salvar orçamento
        </Button>
      </StickyFooter>

      {colando !== null && (
        <PasteOrcamentoDialog
          initialText={colando}
          temMedidos={medidos > 0}
          comDesconto={!aplicaDesconto}
          limite={{
            append: ORCAMENTO_ITENS_MAX - linhas.filter(preenchida).length,
            replace: ORCAMENTO_ITENS_MAX - medidos,
          }}
          onClose={() => setColando(null)}
          onApply={aplicarColagem}
        />
      )}
      <ConfirmDialog
        open={emitindo !== null}
        tone="neutral"
        icon={Send}
        title={`Emitir a ${ordemServico.numero} para a empresa?`}
        confirmLabel="Emitir OS"
        loading={emitindo === "enviando"}
        onConfirm={handleEmitir}
        onCancel={() => setEmitindo(null)}
      >
        A empresa passa a ver a OS, com o valor de {formatCurrency(valorOs ?? total)}, e tem 48 horas para dar
        ciência. Depois disso, mudar o valor do orçamento reemite a OS.
      </ConfirmDialog>
      {guard.dialog}
    </>
  );
}
