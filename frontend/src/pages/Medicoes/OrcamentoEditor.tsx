import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleMinus, ClipboardPaste, FolderPlus, Lock, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { OrcamentoItem, OrcamentoPayload, PlanilhaOrcamento, RegraDesconto } from "../../../types/medicao";
import { useMedicoes } from "../../store/medicoes";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import { formatCurrency } from "../../utils/format-currency";
import { formatValueToCurrencyMask, maskCurrency, parseCurrencyMask } from "../../utils/masks";
import {
  formatQuantidade,
  parseQuantidade,
  precoComDesconto,
  sanitizeDecimalInput,
  toDecimalInput,
  totalComBdiItem,
  totalPorRegra,
} from "../../utils/decimal";
import { ORDEM_SERVICO_ITEM_FIELD_RULES } from "../../utils/normalization/form-rules";
import { normalizeFreeText } from "../../utils/normalization/text-normalizers";
import { cx } from "../../utils/cx";
import { SearchInput } from "../../components/filters/SearchInput";
import {
  Button,
  ConfirmDialog,
  GroupHeader,
  IconButton,
  InlineEdit,
  Input,
  SegmentedControl,
} from "../../components/ui";
import { StickyFooter } from "./Workspace";
import { matchesItemSearch } from "./medicao-progress";
import { ETAPA_MAX, ORCAMENTO_ITENS_MAX, type PastedItem } from "./parse-pasted-budget";
import { contagemItens, gruposPorEtapa, SEM_ETAPA, temEtapas, useEtapasRecolhidas } from "./etapas";
import { PasteOrcamentoDialog, type PasteMode } from "./PasteOrcamentoDialog";
import { SupressoesDialog } from "./SupressoesDialog";

type ItemForm = {
  key: number;
  id?: string;
  codigo: string;
  descricao: string;
  // Vazio = sem etapa
  etapa: string;
  unidade: string;
  quantidade: string;
  // Preço com BDI (o sistema aplica o desconto da OS pela regra dela)
  preco: string;
  // Total ajustado já gravado (planilha antiga ou truncado da SCOAM; máscara de moeda); vale enquanto
  // quantidade, supressão e preço ficam como em `original`. null = calculado pela regra
  total: string | null;
  original: { quantidade: string; preco: string; suprimida: number } | null;
  // Soma das medições fechadas: trava preço e unidade e é o mínimo da quantidade efetiva
  medido: number;
  // Supressão (decimal): parte da quantidade que sai do contrato; 0 = nenhuma
  suprimida: number;
};

type Campo = "codigo" | "descricao" | "unidade" | "quantidade" | "preco" | "empenhos";
type Erro = { key: number | null; campo: Campo | null; texto: string };

const REGRA_DESCONTO_OPTIONS: { value: RegraDesconto; label: string }[] = [
  { value: "SIMPLES", label: "Desconto simples" },
  { value: "SCOAM", label: "Desconto SCOAM" },
];

// Até lg a linha vira cartão; "Total c/ BDI" ganha coluna a partir de xl e "Medido" a partir de 2xl
const COLS =
  "lg:grid-cols-[1.5rem_5.5rem_minmax(0,1fr)_4.5rem_6.5rem_8rem_7.5rem_2rem] xl:grid-cols-[1.5rem_6rem_minmax(0,1fr)_4.5rem_7rem_8.5rem_7.5rem_7.5rem_2rem] 2xl:grid-cols-[1.5rem_6rem_minmax(0,1fr)_4.5rem_7rem_8.5rem_7.5rem_7.5rem_7rem_2rem]";

function toForm(item: OrcamentoItem, key: number): ItemForm {
  return {
    key,
    id: item.id,
    codigo: item.codigo ?? "",
    descricao: item.descricao,
    etapa: item.etapa ?? "",
    unidade: item.unidade,
    quantidade: toDecimalInput(item.quantidade),
    // O campo mostra o preço com BDI (referência); o que vale sai dele com o desconto
    preco: formatValueToCurrencyMask(item.precoReferencia ?? item.precoUnitario),
    total: item.totalAjustado ? formatValueToCurrencyMask(item.valorTotal) : null,
    original: {
      quantidade: toDecimalInput(item.quantidade),
      preco: formatValueToCurrencyMask(item.precoReferencia ?? item.precoUnitario),
      suprimida: item.quantidadeSuprimida,
    },
    medido: item.medido,
    suprimida: item.quantidadeSuprimida,
  };
}

const preenchida = (l: ItemForm) => Boolean(l.id || l.descricao || l.unidade || l.quantidade || l.preco);

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
 * itens). O preço é sempre digitado com BDI e o sistema aplica o desconto da OS pela regra dela
 * (simples ou SCOAM); a linha mostra o total com BDI e o total com desconto. Item medido trava preço
 * e unidade, não sai e tem quantidade mínima. Os campos só viram input ao clicar (InlineEdit).
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
    etapa: "",
    unidade: "",
    quantidade: "",
    preco: "",
    total: null,
    original: null,
    medido: 0,
    suprimida: 0,
    ...patch,
  });
  const [linhas, setLinhas] = useState<ItemForm[]>(() =>
    itens.length > 0 ? itens.map((item) => toForm(item, nextKey.current++)) : [novaLinha()],
  );
  const [regraDesconto, setRegraDesconto] = useState<RegraDesconto>(planilha.regraDesconto);
  // Quanto cada empenho destina à OS (máscara de moeda), quando ela tem mais de um
  const [distribuicao, setDistribuicao] = useState<Record<string, string>>(() =>
    Object.fromEntries(empenhos.map((e) => [e.id, formatValueToCurrencyMask(e.valor)])),
  );
  const serialize = () =>
    JSON.stringify([
      regraDesconto,
      linhas
        .filter(preenchida)
        .map((l) => [l.id ?? null, l.codigo, l.descricao, l.etapa, l.unidade, l.quantidade, l.suprimida, l.preco]),
      empenhos.length > 1 ? distribuicao : null,
    ]);
  const [inicial] = useState(serialize);
  const [erro, setErro] = useState<Erro | null>(null);
  const [saving, setSaving] = useState(false);
  const [emitindo, setEmitindo] = useState<"confirmar" | "enviando" | null>(null);
  const [busca, setBusca] = useState("");
  // null = fechado; texto = colado direto na tela (vazio abre com o campo)
  const [colando, setColando] = useState<string | null>(null);
  const [suprimindo, setSuprimindo] = useState(false);

  const dirty = serialize() !== inicial;
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

  // Preço que vale nas medições: o com BDI, com o desconto da OS pela regra dela
  const precoEfetivo = (l: ItemForm) => precoComDesconto(parseCurrencyMask(l.preco), desconto, regraDesconto);
  // Quantidade que vale: a contratada menos a suprimida
  const quantidadeValida = (l: ItemForm) => {
    const quantidade = parseQuantidade(l.quantidade);
    return quantidade === null ? null : Math.max(0, Math.round((quantidade - l.suprimida) * 1000) / 1000);
  };
  // Quantidade × preço com desconto pela regra (a SCOAM trunca o total)
  const totalCalculado = (l: ItemForm) => {
    const quantidade = quantidadeValida(l);
    return quantidade === null ? 0 : totalPorRegra(quantidade, precoEfetivo(l), regraDesconto, l.suprimida);
  };
  // Total ajustado gravado continua enquanto o item não muda (espelha `manterTotaisAjustados`)
  const inalterado = (l: ItemForm) =>
    l.original !== null &&
    l.original.quantidade === l.quantidade &&
    l.original.preco === l.preco &&
    l.original.suprimida === l.suprimida;
  // Total com desconto da linha
  const totalLinha = (l: ItemForm) =>
    l.total !== null && inalterado(l) ? parseCurrencyMask(l.total) : totalCalculado(l);
  // Total com BDI da linha (quantidade efetiva × preço com BDI; truncado na SCOAM)
  const totalBdiLinha = (l: ItemForm) => {
    const quantidade = quantidadeValida(l);
    return quantidade === null ? 0 : totalComBdiItem(quantidade, parseCurrencyMask(l.preco), regraDesconto);
  };

  const update = (key: number, patch: Partial<ItemForm>) => {
    setLinhas((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
    if (erro?.key === key) setErro(null);
  };

  const normalizar = (key: number, campo: "codigo" | "descricao" | "unidade") => {
    const normalize = ORDEM_SERVICO_ITEM_FIELD_RULES[campo];
    setLinhas((prev) => prev.map((l) => (l.key === key && normalize ? { ...l, [campo]: normalize(l[campo]) } : l)));
  };

  const total = linhas.reduce((acc, l) => acc + totalLinha(l), 0);
  const totalComBdi = Math.round(linhas.reduce((acc, l) => acc + totalBdiLinha(l), 0) * 100) / 100;
  const valorMuda = valorOs !== null && centavos(total) !== centavos(valorOs);
  const medidos = linhas.filter((l) => l.medido > 0).length;
  const comSupressao = linhas.filter((l) => preenchida(l) && l.suprimida > 0);
  // Quanto as supressões tiram: o total da quantidade cheia (pela regra) menos o da efetiva
  const valorSuprimido = comSupressao.reduce(
    (acc, l) =>
      acc + totalPorRegra(parseQuantidade(l.quantidade) ?? 0, precoEfetivo(l), regraDesconto) - totalCalculado(l),
    0,
  );
  const somaDistribuida = empenhos.reduce((acc, e) => acc + parseCurrencyMask(distribuicao[e.id] ?? ""), 0);
  const visiveis = useMemo(
    () =>
      linhas
        .map((l, index) => ({ l, index }))
        // Linha nova (ainda sem texto) aparece mesmo com busca, para não sumir ao ser adicionada
        .filter(({ l }) => (!l.codigo && !l.descricao) || matchesItemSearch(l, busca)),
    [linhas, busca],
  );
  const grupos = gruposPorEtapa(visiveis, ({ l }) => l.etapa);
  const comEtapas = temEtapas(grupos);
  const etapas = useEtapasRecolhidas(busca !== "");

  // Renomear a etapa vale para os itens do grupo (a mesma etapa mais adiante é outro grupo)
  function renomearEtapa(keys: number[], etapa: string) {
    const doGrupo = new Set(keys);
    setLinhas((prev) => prev.map((l) => (doGrupo.has(l.key) ? { ...l, etapa } : l)));
  }

  // Item novo no fim da etapa (logo depois do último item do grupo)
  function adicionarNaEtapa(ultimaKey: number, etapa: string) {
    setLinhas((prev) => {
      const index = prev.findIndex((l) => l.key === ultimaKey);
      return [...prev.slice(0, index + 1), novaLinha({ etapa }), ...prev.slice(index + 1)];
    });
  }

  function novaEtapa() {
    setBusca("");
    const nomes = new Set(linhas.map((l) => l.etapa));
    let n = 1;
    while (nomes.has(`Etapa ${n}`)) n++;
    setLinhas((prev) => [...prev, novaLinha({ etapa: `Etapa ${n}` })]);
  }

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
      if (l.suprimida > quantidade) {
        return {
          key: l.key,
          campo: "quantidade",
          texto: `${pos}: a quantidade não pode ficar abaixo da suprimida (${formatQuantidade(l.suprimida)} ${l.unidade}).`,
        };
      }
      if (l.medido > 0 && quantidade - l.suprimida < l.medido - 1e-9) {
        return {
          key: l.key,
          campo: "quantidade",
          texto: `${pos}: com a supressão de ${formatQuantidade(l.suprimida)} ${l.unidade}, sobra menos do que já foi medido (${formatQuantidade(l.medido)}).`,
        };
      }
      if (!l.preco) return { key: l.key, campo: "preco", texto: `${pos}: informe o preço com BDI.` };
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
    // O item com erro pode estar escondido pela busca ou numa etapa recolhida: limpa e leva até ele
    if (problema.key !== null) {
      setBusca("");
      const grupo = gruposPorEtapa(
        linhas.map((l, index) => ({ l, index })),
        ({ l }) => l.etapa,
      ).find((g) => g.itens.some(({ l }) => l.key === problema.key));
      if (grupo) etapas.abrir(grupo.key);
    }
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
      precoBase: "COM_BDI",
      regraDesconto,
      itens: linhas.filter(preenchida).map((l) => ({
        ...(l.id ? { id: l.id } : {}),
        codigo: l.codigo,
        descricao: l.descricao,
        etapa: l.etapa,
        unidade: l.unidade,
        quantidade: parseQuantidade(l.quantidade) ?? 0,
        quantidadeSuprimida: l.suprimida,
        precoUnitario: parseCurrencyMask(l.preco),
        // O backend calcula o total pela regra e mantém o ajustado gravado do item que não mudou
        valorTotal: null,
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
        etapa: item.etapa,
        unidade: item.unidade,
        quantidade: toDecimalInput(item.quantidade),
        preco: formatValueToCurrencyMask(item.precoUnitario),
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

  // Supressões aplicadas pelo diálogo (mudar a supressão já desfaz o total ajustado da linha)
  function aplicarSupressoes(supressoes: Map<number, number>) {
    setLinhas((prev) =>
      prev.map((l) => {
        const suprimida = supressoes.get(l.key);
        if (suprimida === undefined || suprimida === l.suprimida) return l;
        return { ...l, suprimida };
      }),
    );
    setErro(null);
    setSuprimindo(false);
  }

  const invalido = (l: ItemForm, campo: Campo) => erro?.key === l.key && erro.campo === campo;

  // Linha de um item (cartão até lg, grade a partir dele)
  const renderLinha = ({ l, index }: { l: ItemForm; index: number }) => {
    const medido = l.medido > 0;
    const suprimido = l.suprimida > 0;
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
              aria-label={`Preço com BDI do item ${index + 1}`}
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
            {l.preco && (
              <p
                className="mt-0.5 pr-2.5 text-right text-[11px] text-text-muted tabular-nums truncate"
                title="Preço que vale nas medições: com o desconto da OS"
              >
                c/ desc. {formatCurrency(precoEfetivo(l))}
              </p>
            )}
          </div>
          <span
            className="hidden xl:flex h-8 items-center justify-end px-2.5 text-xs text-text-secondary tabular-nums truncate"
            title="Total com BDI"
          >
            {formatCurrency(totalBdiLinha(l))}
          </span>
          <div className="min-w-0">
            <span
              className="flex h-8 items-center justify-end px-2.5 text-xs font-semibold text-text-primary tabular-nums truncate"
              title="Total com desconto"
            >
              {formatCurrency(totalLinha(l))}
            </span>
            {l.preco && (
              <p className="xl:hidden mt-0.5 pr-2.5 text-right text-[11px] text-text-muted tabular-nums truncate">
                c/ BDI {formatCurrency(totalBdiLinha(l))}
              </p>
            )}
          </div>
          <span
            className={cx(
              "hidden 2xl:flex h-8 items-center justify-end text-xs tabular-nums truncate",
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
        {suprimido && (
          <p className="mt-1 lg:pl-8 flex flex-wrap items-center gap-x-1 text-[11px] text-danger-text tabular-nums">
            <CircleMinus size={11} />
            Suprimido {formatQuantidade(l.suprimida)} {l.unidade} de {formatQuantidade(parseQuantidade(l.quantidade) ?? 0)}:
            vale {formatQuantidade(quantidadeValida(l) ?? 0)} {l.unidade}
          </p>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <SegmentedControl
            label="Como o desconto é aplicado"
            options={REGRA_DESCONTO_OPTIONS}
            value={regraDesconto}
            onChange={setRegraDesconto}
            disabled={!permissoes.trocarPrecoBase}
          />
          <span className="text-[11px] text-text-muted">
            {!permissoes.trocarPrecoBase
              ? `Preços com BDI e desconto de ${formatPercentual(desconto)}. Regra travada: já há medição fechada com estes preços.`
              : regraDesconto === "SCOAM"
                  ? `Desconto de ${formatPercentual(desconto)} em cada preço, truncando o valor do desconto e o total do item (planilha SCOAM).`
                  : `Desconto de ${formatPercentual(desconto)} em cada preço, truncando o preço com desconto no centavo.`}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 lg:ml-auto lg:w-auto">
          <SearchInput value={busca} onChange={setBusca} placeholder="Buscar item por código ou descrição..." />
          <Button variant="secondary" size="sm" icon={ClipboardPaste} onClick={() => setColando("")}>
            Colar do Excel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={CircleMinus}
            disabled={!linhas.some(preenchida)}
            onClick={() => setSuprimindo(true)}
          >
            Supressões
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
          <span className="text-right">Preço c/ BDI</span>
          <span className="hidden xl:block text-right">Total c/ BDI</span>
          <span className="text-right">Total c/ desc.</span>
          <span className="hidden 2xl:block text-right">Medido</span>
          <span />
        </div>

        <div className="space-y-3 lg:space-y-1">
          {grupos.map((grupo, g) => {
            const aberta = etapas.aberta(grupo.key);
            const ultima = grupo.itens.at(-1)!.l;
            const subtotal = grupo.itens.reduce((acc, { l }) => acc + totalLinha(l), 0);
            return (
              <Fragment key={grupo.key}>
                {comEtapas && (
                  <GroupHeader
                    className={g > 0 ? "mt-3" : undefined}
                    editable
                    title={
                      <EtapaNome
                        key={grupo.etapa ?? ""}
                        nome={grupo.etapa ?? ""}
                        disabled={busca !== ""}
                        onRename={(etapa) => renomearEtapa(grupo.itens.map(({ l }) => l.key), etapa)}
                      />
                    }
                    count={contagemItens(grupo.itens.length)}
                    meta={formatCurrency(subtotal)}
                    actions={
                      <IconButton
                        icon={Plus}
                        label={`Adicionar item em ${grupo.etapa ?? SEM_ETAPA.toLowerCase()}`}
                        onClick={() => {
                          etapas.abrir(grupo.key);
                          adicionarNaEtapa(ultima.key, ultima.etapa);
                        }}
                      />
                    }
                    open={aberta}
                    onToggle={() => etapas.alternar(grupo.key)}
                  />
                )}
                {aberta && grupo.itens.map(renderLinha)}
              </Fragment>
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
              // Continua a última etapa
              setLinhas((prev) => [...prev, novaLinha({ etapa: prev.at(-1)?.etapa ?? "" })]);
            }}
          >
            Adicionar item
          </Button>
          <Button variant="ghost" size="sm" icon={FolderPlus} onClick={novaEtapa}>
            Nova etapa
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
                <span className="tabular-nums">Total c/ BDI {formatCurrency(totalComBdi)}</span>
                <span className="text-text-muted tabular-nums">
                  {" "}
                  · desconto {formatPercentual(desconto)} (−{formatCurrency(Math.round((totalComBdi - total) * 100) / 100)}) ·{" "}
                </span>
                Total c/ desconto (valor da OS){" "}
                <span className="font-semibold text-text-primary tabular-nums">{formatCurrency(total)}</span>
                <span className="text-text-muted tabular-nums">
                  {" "}
                  · {linhas.filter(preenchida).length} itens{medidos > 0 ? ` · ${medidos} já medidos` : ""}
                </span>
                {comSupressao.length > 0 && (
                  <span className="text-danger-text tabular-nums">
                    {" "}
                    · {comSupressao.length} {comSupressao.length === 1 ? "supressão" : "supressões"} (−
                    {formatCurrency(valorSuprimido)})
                  </span>
                )}
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
          comDesconto={false}
          limite={{
            append: ORCAMENTO_ITENS_MAX - linhas.filter(preenchida).length,
            replace: ORCAMENTO_ITENS_MAX - medidos,
          }}
          onClose={() => setColando(null)}
          onApply={aplicarColagem}
        />
      )}
      {suprimindo && (
        <SupressoesDialog
          itens={linhas.flatMap((l, index) =>
            preenchida(l)
              ? [
                  {
                    key: l.key,
                    posicao: index + 1,
                    codigo: l.codigo,
                    descricao: l.descricao,
                    etapa: l.etapa,
                    unidade: l.unidade,
                    quantidade: parseQuantidade(l.quantidade) ?? 0,
                    suprimida: l.suprimida,
                    medido: l.medido,
                    preco: precoEfetivo(l),
                  },
                ]
              : [],
          )}
          onClose={() => setSuprimindo(false)}
          onApply={aplicarSupressoes}
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

interface EtapaNomeProps {
  nome: string;
  disabled: boolean;
  onRename: (etapa: string) => void;
}

// Nome da etapa editado no lugar. Grava ao sair do campo: renomear a cada tecla juntaria e
// separaria grupos enquanto o usuário digita
function EtapaNome({ nome, disabled, onRename }: EtapaNomeProps) {
  const [draft, setDraft] = useState(nome);
  const revertido = useRef(false);
  return (
    <InlineEdit
      size="sm"
      aria-label="Nome da etapa"
      placeholder="Nome da etapa"
      optional
      value={draft}
      display={<span className="text-[11px] font-semibold uppercase tracking-wide">{draft || SEM_ETAPA}</span>}
      maxLength={ETAPA_MAX}
      disabled={disabled}
      title={disabled ? "Limpe a busca para renomear a etapa" : "Renomear a etapa (vazio = sem etapa)"}
      onChange={(e) => setDraft(e.target.value)}
      onRevert={(original) => {
        revertido.current = true;
        setDraft(original);
      }}
      onBlur={(e) => {
        if (revertido.current) {
          revertido.current = false;
          return;
        }
        const etapa = normalizeFreeText(e.currentTarget.value);
        setDraft(etapa);
        if (etapa !== nome) onRename(etapa);
      }}
    />
  );
}
