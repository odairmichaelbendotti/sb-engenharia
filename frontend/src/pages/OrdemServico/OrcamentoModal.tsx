import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ListPlus, Lock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { OrcamentoItem, OrcamentoItemPayload } from "../../../types/medicao";
import { useMedicoes } from "../../store/medicoes";
import { formatCurrency } from "../../utils/format-currency";
import { formatValueToCurrencyMask, maskCurrency, parseCurrencyMask } from "../../utils/masks";
import { formatQuantidade, parseQuantidade, sanitizeDecimalInput, toDecimalInput, valorItem } from "../../utils/decimal";
import { ORDEM_SERVICO_ITEM_FIELD_RULES } from "../../utils/normalization/form-rules";
import { cx } from "../../utils/cx";
import { Button, IconButton, Input, Modal, ModalBody, ModalFooter, ModalHeader } from "../../components/ui";

type ItemForm = {
  key: number;
  id?: string;
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade: string;
  preco: string;
  // Soma das medições fechadas: trava preço e unidade e é o mínimo da quantidade
  medido: number;
};

type Campo = "codigo" | "descricao" | "unidade" | "quantidade" | "preco";

const COLS = "lg:grid-cols-[1.5rem_5.5rem_minmax(0,1fr)_4.5rem_6.5rem_8rem_7rem_2rem]";

function toForm(item: OrcamentoItem, key: number): ItemForm {
  return {
    key,
    id: item.id,
    codigo: item.codigo ?? "",
    descricao: item.descricao,
    unidade: item.unidade,
    quantidade: toDecimalInput(item.quantidade),
    preco: formatValueToCurrencyMask(item.precoUnitario),
    medido: item.medido,
  };
}

function totalLinha(item: ItemForm) {
  const quantidade = parseQuantidade(item.quantidade);
  return quantidade === null ? 0 : valorItem(quantidade, parseCurrencyMask(item.preco));
}

interface OrcamentoModalProps {
  open: boolean;
  ordemServicoId: string;
  numero: string;
  itens: OrcamentoItem[];
  // Valor final da OS (com BDI e desconto do lote), para comparar com a soma dos itens
  valorOs: number | null;
  onClose: () => void;
  onSaved: () => void;
}

// Planilha orçamentária da OS: descrição, unidade, quantidade e preço unitário (com BDI e desconto)
export function OrcamentoModal({ open, ordemServicoId, numero, itens, valorOs, onClose, onSaved }: OrcamentoModalProps) {
  const saveOrcamento = useMedicoes((s) => s.saveOrcamento);
  const nextKey = useRef(0);
  const novaLinha = (): ItemForm => ({
    key: nextKey.current++,
    codigo: "",
    descricao: "",
    unidade: "",
    quantidade: "",
    preco: "",
    medido: 0,
  });
  const [linhas, setLinhas] = useState<ItemForm[]>(() =>
    itens.length > 0 ? itens.map((item) => toForm(item, nextKey.current++)) : [novaLinha()],
  );
  const [erro, setErro] = useState<{ key: number | null; campo: Campo | null; texto: string } | null>(null);
  const [saving, setSaving] = useState(false);

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

  // Primeiro problema, na ordem da planilha (a mensagem aponta o item)
  function validar(): { key: number | null; campo: Campo | null; texto: string } | null {
    const preenchidas = linhas.filter((l) => l.id || l.descricao || l.unidade || l.quantidade || l.preco);
    if (preenchidas.length === 0 && itens.length === 0) {
      return { key: linhas[0]?.key ?? null, campo: "descricao", texto: "Inclua ao menos um item no orçamento." };
    }
    for (const [index, l] of linhas.entries()) {
      if (!preenchidas.includes(l)) continue;
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
    }
    return null;
  }

  async function handleSave() {
    const problema = validar();
    if (problema) {
      setErro(problema);
      return;
    }
    const payload: OrcamentoItemPayload[] = linhas
      .filter((l) => l.id || l.descricao || l.unidade || l.quantidade || l.preco)
      .map((l) => ({
        ...(l.id ? { id: l.id } : {}),
        codigo: l.codigo,
        descricao: l.descricao,
        unidade: l.unidade,
        quantidade: parseQuantidade(l.quantidade) ?? 0,
        precoUnitario: parseCurrencyMask(l.preco),
      }));
    setSaving(true);
    try {
      await saveOrcamento(ordemServicoId, payload);
      toast.success("Orçamento salvo");
      onSaved();
    } catch (err) {
      setErro({ key: null, campo: null, texto: err instanceof Error ? err.message : "Erro ao salvar o orçamento" });
    } finally {
      setSaving(false);
    }
  }

  const invalido = (l: ItemForm, campo: Campo) => erro?.key === l.key && erro.campo === campo;

  return (
    <Modal open={open} size="2xl" onClose={onClose}>
      <ModalHeader
        icon={ListPlus}
        title={itens.length > 0 ? "Editar orçamento" : "Lançar orçamento"}
        description={`${numero} · preços unitários já com BDI e desconto do lote`}
        onClose={onClose}
      />
      <ModalBody className="space-y-3">
        {erro && (
          <div className="flex items-start gap-2 rounded-lg border border-danger-border bg-danger-bg px-3 py-2.5">
            <AlertTriangle size={16} className="text-danger-text shrink-0 mt-0.5" />
            <p className="text-sm text-danger-text">{erro.texto}</p>
          </div>
        )}

        <div className={cx("hidden lg:grid gap-2 px-0.5 text-[11px] font-semibold uppercase tracking-wide text-text-secondary", COLS)}>
          <span>#</span>
          <span>Código</span>
          <span>Descrição do serviço</span>
          <span>Un</span>
          <span className="text-right">Quantidade</span>
          <span className="text-right">Preço unit.</span>
          <span className="text-right">Total</span>
          <span />
        </div>

        <div className="space-y-3 lg:space-y-2">
          {linhas.map((l, index) => {
            const medido = l.medido > 0;
            return (
              <div
                key={l.key}
                className="rounded-lg border border-border p-2.5 lg:border-0 lg:p-0"
              >
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
                  <span className="text-sm font-semibold text-text-primary tabular-nums text-right truncate">
                    {formatCurrency(totalLinha(l))}
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
              </div>
            );
          })}
        </div>

        <Button variant="secondary" size="sm" icon={Plus} onClick={() => setLinhas((prev) => [...prev, novaLinha()])}>
          Adicionar item
        </Button>
      </ModalBody>
      <ModalFooter className="justify-between">
        <div className="min-w-0">
          <p className="text-sm text-text-secondary">
            Total do orçamento{" "}
            <span className="font-semibold text-text-primary tabular-nums">{formatCurrency(total)}</span>
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
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button loading={saving} onClick={handleSave}>
            Salvar orçamento
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
