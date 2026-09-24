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
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useContratos } from "../../store/contratos";
import { useOrdensServico } from "../../store/ordensServico";
import { maskCurrency, formatValueToCurrencyMask, parseCurrencyMask } from "../../utils/masks";
import type { OrdemServico, OrdemServicoStatus, CreateOrdemServicoPayload } from "../../../types/ordem-servico";

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
  valor: string;
};

const emptyForm: FormState = {
  numero: "",
  valor: "",
};

const inputClass =
  "w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all";

const iconInputClass =
  "w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all";

export function OrdemServicoModal({ ordemServico, handleClose }: OrdemServicoModalProps) {
  const { createOrdemServico, updateOrdemServico, updateOrdemServicoStatus, fetchOrdensServico } = useOrdensServico();
  const { options: contratoOptions, fetchContratoOptions } = useContratos();
  const [isLoading, setIsLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<OrdemServicoStatus | null>(null);
  const [currentStatus, setCurrentStatus] = useState<OrdemServicoStatus>(ordemServico?.status ?? "ATIVO");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedContratoId, setSelectedContratoId] = useState("");
  const [empenhoId, setEmpenhoId] = useState("");

  useEffect(() => {
    if (!ordemServico) fetchContratoOptions();
  }, [ordemServico, fetchContratoOptions]);

  const empenhosDoContrato = contratoOptions.find((c) => c.id === selectedContratoId)?.empenhos ?? [];

  useEffect(() => {
    if (ordemServico) {
      setCurrentStatus(ordemServico.status);
      setForm({
        numero: ordemServico.numero,
        valor: formatValueToCurrencyMask(ordemServico.valor),
      });
    } else {
      setForm(emptyForm);
      setCurrentStatus("ATIVO");
    }
  }, [ordemServico]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "valor" ? maskCurrency(value) : value }));
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

    if (!form.numero || !form.valor) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!ordemServico && !empenhoId) {
      toast.error("Selecione o contrato e o empenho vinculados a esta ordem de serviço");
      return;
    }

    const valorNum = parseCurrencyMask(form.valor);
    if (valorNum <= 0) {
      toast.error("Valor inválido");
      return;
    }

    const payload: CreateOrdemServicoPayload = {
      numero: form.numero,
      valor: valorNum.toString(),
      empenho_id: ordemServico ? ordemServico.empenho_id : empenhoId,
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

        <form className="p-5 overflow-y-auto space-y-5" onSubmit={handleSubmit}>
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
                  onChange={handleChange}
                  placeholder="04/01/BAFL/2026"
                  className={iconInputClass}
                />
              </div>
            </div>
          </div>

          {/* Vínculo com Contrato/Empenho */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <FileSignature size={16} className="text-primary-500" />
              <span>Contrato e Empenho</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            {ordemServico ? (
              <div className="bg-surface-muted rounded-lg p-4 border border-border flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                  <Layers2 size={18} className="text-primary-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {ordemServico.empenho.contrato.identificador} — {ordemServico.empenho.contrato.descricaoCurta}
                  </p>
                  <p className="text-xs text-text-secondary">Empenho {ordemServico.empenho.numero} (vínculo fixo, não editável)</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Contrato <span className="text-danger-text">*</span>
                  </label>
                  <select
                    value={selectedContratoId}
                    onChange={(e) => {
                      setSelectedContratoId(e.target.value);
                      setEmpenhoId("");
                    }}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="">Selecione um contrato</option>
                    {contratoOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.identificador} — {c.descricaoCurta}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Empenho <span className="text-danger-text">*</span>
                  </label>
                  <select
                    value={empenhoId}
                    onChange={(e) => setEmpenhoId(e.target.value)}
                    disabled={!selectedContratoId}
                    className={`${inputClass} cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <option value="">
                      {selectedContratoId ? "Selecione um empenho" : "Selecione um contrato primeiro"}
                    </option>
                    {empenhosDoContrato.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.numero} — {e.description}
                      </option>
                    ))}
                  </select>
                  {selectedContratoId && empenhosDoContrato.length === 0 && (
                    <p className="text-xs text-warning-text mt-1">
                      Este contrato não possui empenhos disponíveis para vincular.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Financeiro */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <DollarSign size={16} className="text-primary-500" />
              <span>Financeiro</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Valor da Ordem de Serviço (R$) <span className="text-danger-text">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-medium text-sm">R$</span>
                <input
                  name="valor"
                  inputMode="numeric"
                  value={form.valor}
                  onChange={handleChange}
                  placeholder="0,00"
                  className={iconInputClass}
                />
              </div>
              <p className="text-xs text-text-muted mt-1">
                Este valor é uma parcela do empenho — a criação será recusada se exceder o saldo disponível.
              </p>
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
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
