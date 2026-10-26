import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardPaste, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { OrcamentoItem, OrcamentoItemPayload, PlanilhaOrcamento } from "../../../types/medicao";
import { useMedicoes } from "../../store/medicoes";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import { formatCurrency } from "../../utils/format-currency";
import { formatValueToCurrencyMask, maskCurrency, parseCurrencyMask } from "../../utils/masks";
import {
  folgaValorTotal,
  formatQuantidade,
  parseQuantidade,
  sanitizeDecimalInput,
  toDecimalInput,
  valorItem,
} from "../../utils/decimal";
import { ORDEM_SERVICO_ITEM_FIELD_RULES } from "../../utils/normalization/form-rules";
import { cx } from "../../utils/cx";
import { SearchInput } from "../../components/filters/SearchInput";
import { Button, IconButton, Input } from "../../components/ui";
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
  preco: string;
  // Total ajustado (máscara de moeda) para bater com a planilha de referência; null = qtd × preço
  total: string | null;
  // Soma das medições fechadas: trava preço e unidade e é o mínimo da quantidade
  medido: number;
};

type Campo = "codigo" | "descricao" | "unidade" | "quantidade" | "preco" | "total";
type Erro = { key: number | null; campo: Campo | null; texto: string };

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
    preco: formatValueToCurrencyMask(item.precoUnitario),
    total: item.totalAjustado ? formatValueToCurrencyMask(item.valorTotal) : null,
    medido: item.medido,
  };
}

// Quantidade × preço, sem o ajuste
function totalCalculado(item: ItemForm) {
  const quantidade = parseQuantidade(item.quantidade);
  return quantidade === null ? 0 : valorItem(quantidade, parseCurrencyMask(item.preco));
}

function totalLinha(item: ItemForm) {
  return item.total === null ? totalCalculado(item) : parseCurrencyMask(item.total);
}

const preenchida = (l: ItemForm) => Boolean(l.id || l.descricao || l.unidade || l.quantidade || l.preco);

// O que vai para a API: comparar com o carregado diz se há alteração não salva
function serialize(linhas: ItemForm[]) {
  return JSON.stringify(
    linhas
      .filter(preenchida)
      .map((l) => [l.id ?? null, l.codigo, l.descricao, l.unidade, l.quantidade, l.preco, l.total]),
  );
}

// Diferença em reais, com sinal ("+R$ 0,01")
function formatDiferenca(valor: number) {
  return `${valor > 0 ? "+" : "−"}${formatCurrency(Math.abs(valor))}`;
}

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

interface OrcamentoEditorProps {
  planilha: PlanilhaOrcamento;
  onSaved: () => void;
}

/**
 * Planilha orçamentária da OS em tela cheia: descrição, unidade, quantidade e preço unitário
 * (com BDI e desconto do lote). Item medido trava preço e unidade, não sai e tem quantidade mínima.
 * O total pode ser ajustado à planilha de referência (truncamento, preço com mais casas), dentro
 * da folga do backend; item medido por inteiro trava o total.
 */
export function OrcamentoEditor({ planilha, onSaved }: OrcamentoEditorProps) {
  const { itens, valorOs, ordemServico } = planilha;
  const saveOrcamento = useMedicoes((s) => s.saveOrcamento);
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
  const [inicial] = useState(() => serialize(linhas));
  const [erro, setErro] = useState<Erro | null>(null);
  const [saving, setSaving] = useState(false);
  const [busca, setBusca] = useState("");
  // null = fechado; texto = colado direto na tela (vazio abre com o campo)
  const [colando, setColando] = useState<string | null>(null);

  const dirty = serialize(linhas) !== inicial;
  const guard = useUnsavedChangesGuard(dirty);

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

  const update = (key: number, patch: Partial<ItemForm>) => {
    setLinhas((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
    if (erro?.key === key) setErro(null);
  };

  const normalizar = (key: number, campo: "codigo" | "descricao" | "unidade") => {
    const normalize = ORDEM_SERVICO_ITEM_FIELD_RULES[campo];
    setLinhas((prev) => prev.map((l) => (l.key === key && normalize ? { ...l, [campo]: normalize(l[campo]) } : l)));
  };

  const total = linhas.reduce((acc, l) => acc + totalLinha(l), 0);
  const diferenca = valorOs === null ? null : Math.round((total - valorOs) * 100) / 100;
  const medidos = linhas.filter((l) => l.medido > 0).length;
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
    if (cheias.length === 0 && itens.length === 0) {
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
      if (l.total !== null) {
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
    const payload: OrcamentoItemPayload[] = linhas.filter(preenchida).map((l) => ({
      ...(l.id ? { id: l.id } : {}),
      codigo: l.codigo,
      descricao: l.descricao,
      unidade: l.unidade,
      quantidade: parseQuantidade(l.quantidade) ?? 0,
      precoUnitario: parseCurrencyMask(l.preco),
      valorTotal: l.total === null ? null : parseCurrencyMask(l.total),
    }));
    setSaving(true);
    try {
      await saveOrcamento(ordemServico.id, payload);
      toast.success("Orçamento salvo");
      guard.allowNextNavigation();
      onSaved();
    } catch (err) {
      setErro({ key: null, campo: null, texto: err instanceof Error ? err.message : "Erro ao salvar o orçamento" });
    } finally {
      setSaving(false);
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
        total: item.valorTotal === null ? null : formatValueToCurrencyMask(item.valorTotal),
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

  // Abre o total da linha para digitar, a partir do calculado
  function ajustarTotal(l: ItemForm) {
    update(l.key, { total: formatValueToCurrencyMask(totalCalculado(l)) });
    requestAnimationFrame(() => {
      const campo = document.querySelector<HTMLInputElement>(`[data-total="${l.key}"]`);
      campo?.focus();
      campo?.select();
    });
  }

  const invalido = (l: ItemForm, campo: Campo) => erro?.key === l.key && erro.campo === campo;

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <SearchInput value={busca} onChange={setBusca} placeholder="Buscar item por código ou descrição..." />
        <Button variant="secondary" size="sm" icon={ClipboardPaste} onClick={() => setColando("")}>
          Colar do Excel
        </Button>
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
          <span className="text-right">Preço unit.</span>
          <span className="text-right">Total</span>
          <span className="hidden xl:block text-right">Medido</span>
          <span />
        </div>

        <div className="space-y-3 lg:space-y-2">
          {visiveis.map(({ l, index }) => {
            const medido = l.medido > 0;
            // Medido por inteiro: a última medição já usou o total, que não muda mais
            const totalTravado = medido && l.medido >= (parseQuantidade(l.quantidade) ?? 0);
            const diferencaTotal = l.total === null ? 0 : Math.round((totalLinha(l) - totalCalculado(l)) * 100) / 100;
            return (
              <div key={l.key} className="rounded-lg border border-border p-2.5 lg:border-0 lg:p-0">
                <div className={cx("grid grid-cols-2 sm:grid-cols-4 gap-2 items-center", COLS)}>
                  <span className="hidden lg:block text-xs text-text-muted tabular-nums text-center">{index + 1}</span>
                  <Input
                    size="sm"
                    aria-label={`Código do item ${index + 1}`}
                    placeholder="Código"
                    value={l.codigo}
                    maxLength={40}
                    onChange={(e) => update(l.key, { codigo: e.target.value })}
                    onBlur={() => normalizar(l.key, "codigo")}
                  />
                  <Input
                    size="sm"
                    className="col-span-2 sm:col-span-3 lg:col-span-1"
                    aria-label={`Descrição do item ${index + 1}`}
                    placeholder="Descrição do serviço (ex.: execução de reboco)"
                    title={l.descricao}
                    value={l.descricao}
                    maxLength={500}
                    invalid={invalido(l, "descricao")}
                    onChange={(e) => update(l.key, { descricao: e.target.value })}
                    onBlur={() => normalizar(l.key, "descricao")}
                  />
                  <Input
                    size="sm"
                    aria-label={`Unidade do item ${index + 1}`}
                    placeholder="m²"
                    value={l.unidade}
                    maxLength={20}
                    disabled={medido}
                    invalid={invalido(l, "unidade")}
                    onChange={(e) => update(l.key, { unidade: e.target.value })}
                    onBlur={() => normalizar(l.key, "unidade")}
                  />
                  <Input
                    size="sm"
                    aria-label={`Quantidade do item ${index + 1}`}
                    inputMode="decimal"
                    placeholder="0,00"
                    value={l.quantidade}
                    invalid={invalido(l, "quantidade")}
                    onChange={(e) => update(l.key, { quantidade: sanitizeDecimalInput(e.target.value) })}
                  />
                  <Input
                    size="sm"
                    aria-label={`Preço unitário do item ${index + 1}`}
                    inputMode="numeric"
                    prefix="R$"
                    placeholder="0,00"
                    value={l.preco}
                    disabled={medido}
                    invalid={invalido(l, "preco")}
                    onChange={(e) => update(l.key, { preco: maskCurrency(e.target.value) })}
                  />
                  {l.total !== null && !totalTravado ? (
                    <Input
                      size="sm"
                      data-total={l.key}
                      aria-label={`Total ajustado do item ${index + 1}`}
                      inputMode="numeric"
                      placeholder="0,00"
                      value={l.total}
                      invalid={invalido(l, "total")}
                      onChange={(e) => update(l.key, { total: maskCurrency(e.target.value) })}
                    />
                  ) : (
                    <button
                      type="button"
                      disabled={totalTravado}
                      title={
                        totalTravado
                          ? "Item medido por inteiro: o total não muda mais"
                          : "Ajustar o total para bater com a planilha de referência"
                      }
                      className="group flex items-center justify-end gap-1 min-w-0 rounded-md px-1 -mx-1 text-sm font-semibold text-text-primary tabular-nums cursor-pointer hover:bg-surface-muted disabled:cursor-default disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary-200"
                      onClick={() => ajustarTotal(l)}
                    >
                      {!totalTravado && (
                        <Pencil
                          size={12}
                          className="shrink-0 text-text-muted opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                        />
                      )}
                      <span className="truncate">{formatCurrency(totalLinha(l))}</span>
                    </button>
                  )}
                  <span
                    className={cx(
                      "hidden xl:block text-xs tabular-nums text-right truncate",
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
                {l.total !== null && (
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
            Dica: copie as linhas no Excel e cole (Ctrl+V) em qualquer ponto fora de um campo.
          </span>
        </div>
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
                Total do orçamento{" "}
                <span className="font-semibold text-text-primary tabular-nums">{formatCurrency(total)}</span>
                <span className="text-text-muted">
                  {" "}
                  · {linhas.filter(preenchida).length} itens{medidos > 0 ? ` · ${medidos} já medidos` : ""}
                </span>
              </p>
              {diferenca !== null && (
                <p
                  className={cx(
                    "flex items-center gap-1 text-xs tabular-nums mt-0.5",
                    diferenca === 0 ? "text-success-text" : "text-warning-text",
                  )}
                >
                  {diferenca === 0 ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                  {diferenca === 0
                    ? "Confere com o valor da OS"
                    : `${diferenca > 0 ? "Acima" : "Abaixo"} do valor da OS (${formatCurrency(valorOs ?? 0)}) em ${formatCurrency(Math.abs(diferenca))}`}
                </p>
              )}
            </>
          )
        }
      >
        {dirty && <span className="text-[11px] text-warning-text">Alterações não salvas</span>}
        <Button loading={saving} disabled={!dirty && itens.length > 0} onClick={handleSave}>
          Salvar orçamento
        </Button>
      </StickyFooter>

      {colando !== null && (
        <PasteOrcamentoDialog
          initialText={colando}
          temMedidos={medidos > 0}
          limite={{
            append: ORCAMENTO_ITENS_MAX - linhas.filter(preenchida).length,
            replace: ORCAMENTO_ITENS_MAX - medidos,
          }}
          onClose={() => setColando(null)}
          onApply={aplicarColagem}
        />
      )}
      {guard.dialog}
    </>
  );
}
