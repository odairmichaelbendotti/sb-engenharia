import {
  X,
  ClipboardList,
  Hash,
  FileSignature,
  Layers2,
  DollarSign,
  Loader,
  Activity,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useEmpenhos } from "../../store/empenhos";
import { useOrdensServico } from "../../store/ordensServico";
import { maskCurrency, formatValueToCurrencyMask, parseCurrencyMask } from "../../utils/masks";
import { formatCurrency } from "../../utils/format-currency";
import type { OrdemServico, OrdemServicoStatus, CreateOrdemServicoPayload } from "../../../types/ordem-servico";
import { createBlurNormalizer, ORDEM_SERVICO_FIELD_RULES } from "../../utils/normalization/form-rules";

interface OrdemServicoModalProps {
  ordemServico: OrdemServico | null;
  handleClose: () => void;
}

const STATUS_OPTIONS: { value: OrdemServicoStatus; label: string; icon: React.ElementType; activeClass: string; hoverClass: string }[] = [
  { value: "ATIVO", label: "Ativa", icon: Activity, activeClass: "bg-warning-text text-white border-warning-text", hoverClass: "hover:border-warning-border hover:text-warning-text" },
  { value: "FINALIZADO", label: "Finalizada", icon: CheckCircle2, activeClass: "bg-success-text text-white border-success-text", hoverClass: "hover:border-success-border hover:text-success-text" },
  { value: "CANCELADO", label: "Cancelada", icon: XCircle, activeClass: "bg-danger-text text-white border-danger-text", hoverClass: "hover:border-danger-border hover:text-danger-text" },
];

type FormState = {
  numero: string;
};

// Uma linha da lista de empenhos: qual empenho e quanto dele vai para a OS
type VinculoForm = {
  key: number;
  empenho_id: string;
  valor: string;
};

const inputClass =
  "w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all";

const iconInputClass =
  "w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all";

export function OrdemServicoModal({ ordemServico, handleClose }: OrdemServicoModalProps) {
  const { createOrdemServico, updateOrdemServico, updateOrdemServicoStatus, fetchOrdensServico } = useOrdensServico();
  const { data: empenhosData, fetchListEmpenhos } = useEmpenhos();
  const [isLoading, setIsLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<OrdemServicoStatus | null>(null);
  const [currentStatus, setCurrentStatus] = useState<OrdemServicoStatus>(ordemServico?.status ?? "ATIVO");
  const [form, setForm] = useState<FormState>({ numero: ordemServico?.numero ?? "" });
  const [selectedContratoId, setSelectedContratoId] = useState(ordemServico?.empenho.contrato.id ?? "");
  const nextKey = useRef(0);
  const [vinculos, setVinculos] = useState<VinculoForm[]>(() =>
    ordemServico
      ? ordemServico.empenhos.map((v) => ({
          key: nextKey.current++,
          empenho_id: v.empenho_id,
          valor: formatValueToCurrencyMask(v.valor),
        }))
      : [{ key: nextKey.current++, empenho_id: "", valor: "" }],
  );

  // Lista de empenhos sempre atualizada ao abrir: é dela que vêm os saldos livres
  useEffect(() => {
    fetchListEmpenhos().catch(() => toast.error("Erro ao carregar os empenhos"));
  }, [fetchListEmpenhos]);

  const empenhos = useMemo(() => empenhosData?.empenhos ?? [], [empenhosData]);

  // Contratos que têm empenho — todos os empenhos da OS precisam ser do mesmo contrato
  const contratos = useMemo(() => {
    const byId = new Map<string, { id: string; identificador: string; descricaoCurta: string }>();
    for (const empenho of empenhos) byId.set(empenho.contrato.id, empenho.contrato);
    return [...byId.values()].sort((a, b) => a.identificador.localeCompare(b.identificador));
  }, [empenhos]);

  // Na edição, o que esta OS já usa de cada empenho volta a contar como saldo livre dela
  const valorJaNaOS = useMemo(
    () => new Map((ordemServico?.empenhos ?? []).map((v) => [v.empenho_id, v.valor])),
    [ordemServico],
  );
  const saldoLivre = (empenhoId: string) => {
    const empenho = empenhos.find((e) => e.id === empenhoId);
    return empenho ? empenho.saldoDisponivel + (valorJaNaOS.get(empenhoId) ?? 0) : 0;
  };

  const empenhosDoContrato = empenhos.filter(
    (e) => e.contrato.id === selectedContratoId && (e.status !== "CANCELADO" || valorJaNaOS.has(e.id)),
  );

  const valorTotal = vinculos.reduce((sum, v) => sum + parseCurrencyMask(v.valor), 0);

  function handleNumeroChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ numero: e.target.value });
  }

  function handleContratoChange(contratoId: string) {
    setSelectedContratoId(contratoId);
    // Trocar de contrato zera os empenhos escolhidos (precisam ser do mesmo contrato)
    setVinculos([{ key: nextKey.current++, empenho_id: "", valor: "" }]);
  }

  function handleEmpenhoChange(key: number, empenhoId: string) {
    // Por padrão o empenho vai inteiro: preenche com todo o saldo livre dele
    setVinculos((prev) =>
      prev.map((v) =>
        v.key === key
          ? { ...v, empenho_id: empenhoId, valor: empenhoId ? formatValueToCurrencyMask(saldoLivre(empenhoId)) : "" }
          : v,
      ),
    );
  }

  function handleValorChange(key: number, value: string) {
    setVinculos((prev) => prev.map((v) => (v.key === key ? { ...v, valor: maskCurrency(value) } : v)));
  }

  function addVinculo() {
    setVinculos((prev) => [...prev, { key: nextKey.current++, empenho_id: "", valor: "" }]);
  }

  function removeVinculo(key: number) {
    setVinculos((prev) => prev.filter((v) => v.key !== key));
  }

  async function handleStatusChange(status: OrdemServicoStatus) {
    if (!ordemServico) return;
    setUpdatingStatus(status);
    try {
      await updateOrdemServicoStatus(ordemServico.id, status);
      setCurrentStatus(status);
      toast.success(`Status atualizado para "${status}"`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar status";
      toast.error(message);
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.numero) {
      toast.error("Preencha o número da ordem de serviço");
      return;
    }
    if (!selectedContratoId) {
      toast.error("Selecione o contrato da ordem de serviço");
      return;
    }

    const preenchidos = vinculos.filter((v) => v.empenho_id);
    if (preenchidos.length === 0) {
      toast.error("Vincule pelo menos um empenho à ordem de serviço");
      return;
    }
    for (const v of preenchidos) {
      const valor = parseCurrencyMask(v.valor);
      const numero = empenhos.find((e) => e.id === v.empenho_id)?.numero ?? "";
      if (valor <= 0) {
        toast.error(`Informe o valor destinado do empenho ${numero}`);
        return;
      }
      if (Math.round(valor * 100) > Math.round(saldoLivre(v.empenho_id) * 100)) {
        toast.error(`O valor do empenho ${numero} excede o saldo livre dele (${formatCurrency(saldoLivre(v.empenho_id))})`);
        return;
      }
    }

    const payload: CreateOrdemServicoPayload = {
      numero: form.numero,
      empenhos: preenchidos.map((v) => ({ empenho_id: v.empenho_id, valor: parseCurrencyMask(v.valor) })),
    };

    try {
      setIsLoading(true);
      if (ordemServico) {
        await updateOrdemServico(ordemServico.id, payload);
        toast.success(`Ordem de serviço "${form.numero}" atualizada com sucesso!`);
      } else {
        await createOrdemServico(payload);
        toast.success(`Ordem de serviço "${form.numero}" criada com sucesso!`);
      }
      await fetchOrdensServico();
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro inesperado";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  const contratoFixo = ordemServico?.empenho.contrato;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-linear-to-r from-primary-50/50 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <ClipboardList size={20} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                {ordemServico ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}
              </h2>
              <p className="text-sm text-text-secondary">
                {ordemServico ? `Editando: ${ordemServico.numero}` : "Preencha os dados para cadastrar a ordem de serviço"}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 cursor-pointer hover:bg-surface-muted rounded-lg transition-colors">
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <form onBlur={createBlurNormalizer(setForm, ORDEM_SERVICO_FIELD_RULES)} className="p-5 overflow-y-auto space-y-5" onSubmit={handleSubmit}>
          {/* Identificação */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Hash size={16} className="text-primary-500" />
              <span>Identificação</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Número <span className="text-danger-text">*</span>
              </label>
              <div className="relative">
                <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  name="numero"
                  value={form.numero}
                  onChange={handleNumeroChange}
                  placeholder="04/01/BAFL/2026"
                  className={iconInputClass}
                />
              </div>
            </div>
          </div>

          {/* Contrato */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <FileSignature size={16} className="text-primary-500" />
              <span>Contrato</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            {contratoFixo ? (
              <div className="bg-surface-muted rounded-lg p-4 border border-border flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                  <FileSignature size={18} className="text-primary-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {contratoFixo.identificador} — {contratoFixo.descricaoCurta}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {contratoFixo.company.name} · o contrato da OS não muda; os empenhos abaixo são dele
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Contrato <span className="text-danger-text">*</span>
                </label>
                <select
                  value={selectedContratoId}
                  onChange={(e) => handleContratoChange(e.target.value)}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="">Selecione um contrato</option>
                  {contratos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.identificador} — {c.descricaoCurta}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Empenhos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Layers2 size={16} className="text-primary-500" />
              <span>Empenhos</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <p className="text-xs text-text-muted">
              Ao escolher o empenho, o valor já vem com todo o saldo livre dele. Diminua só se o empenho for dividido
              entre várias ordens de serviço.
            </p>

            {vinculos.map((vinculo) => {
              const disponiveis = empenhosDoContrato.filter(
                (e) => e.id === vinculo.empenho_id || !vinculos.some((v) => v.empenho_id === e.id),
              );
              const empenho = empenhos.find((e) => e.id === vinculo.empenho_id);
              return (
                <div key={vinculo.key} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={vinculo.empenho_id}
                      onChange={(e) => handleEmpenhoChange(vinculo.key, e.target.value)}
                      disabled={!selectedContratoId}
                      className={`${inputClass} flex-1 min-w-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <option value="">
                        {selectedContratoId ? "Selecione um empenho" : "Selecione um contrato primeiro"}
                      </option>
                      {disponiveis.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.numero} — {e.description}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <div className="relative sm:w-44 flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-medium text-sm">R$</span>
                        <input
                          inputMode="numeric"
                          aria-label="Valor destinado à OS"
                          value={vinculo.valor}
                          onChange={(e) => handleValorChange(vinculo.key, e.target.value)}
                          placeholder="0,00"
                          className={iconInputClass}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVinculo(vinculo.key)}
                        disabled={vinculos.length === 1}
                        title="Remover empenho da OS"
                        className="p-2.5 cursor-pointer text-text-secondary hover:bg-danger-bg hover:text-danger-text rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {empenho && (
                    <p className="text-xs text-text-muted">
                      Saldo livre: {formatCurrency(saldoLivre(empenho.id))} de {formatCurrency(empenho.value)}
                    </p>
                  )}
                </div>
              );
            })}

            {selectedContratoId && empenhosDoContrato.length === 0 && (
              <p className="text-xs text-warning-text">Este contrato não possui empenhos disponíveis para vincular.</p>
            )}

            <button
              type="button"
              onClick={addVinculo}
              disabled={!selectedContratoId || vinculos.length >= empenhosDoContrato.length}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 border border-primary-200 bg-primary-50 hover:bg-primary-100 rounded-md cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={14} />
              Adicionar outro empenho
            </button>
          </div>

          {/* Financeiro */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <DollarSign size={16} className="text-primary-500" />
              <span>Financeiro</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="bg-surface-muted rounded-lg p-4 border border-border flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-text-muted">Valor da Ordem de Serviço</p>
                <p className="text-xs text-text-secondary">Soma dos valores destinados pelos empenhos</p>
              </div>
              <p className="text-lg font-semibold text-text-primary">{formatCurrency(valorTotal)}</p>
            </div>
          </div>

          {/* Status (somente edição) */}
          {ordemServico && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <Activity size={16} className="text-primary-500" />
                <span>Status da Ordem de Serviço</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="bg-surface-muted rounded-lg p-4 border border-border">
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(({ value, label, icon: Icon, activeClass, hoverClass }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleStatusChange(value)}
                      disabled={updatingStatus !== null}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors
                        ${currentStatus === value ? activeClass : `bg-surface text-text-secondary border-border ${hoverClass}`}
                        ${updatingStatus !== null ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {updatingStatus === value ? (
                        <Loader size={14} className="animate-spin" />
                      ) : (
                        <Icon size={14} />
                      )}
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 cursor-pointer text-text-secondary hover:bg-surface-muted rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader size={18} className="animate-spin" />
              ) : ordemServico ? (
                "Salvar Alterações"
              ) : (
                "Cadastrar Ordem de Serviço"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
