import {
  Loader,
  X,
  Receipt,
  Hash,
  FileSignature,
  Tag,
  AlignLeft,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Activity,
  AlertCircle,
} from "lucide-react";
import { useContratos } from "../../store/contratos";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { defaultFetch } from "../../services/api";
import { useEmpenhos } from "../../store/empenhos";
import { formatCurrency } from "../../utils/format-currency";
import { maskCurrency, formatValueToCurrencyMask, parseCurrencyMask } from "../../utils/masks";
import type { EmpenhoList, EmpenhoCategory } from "../../../types/empenho";

interface EmpenhoModalProps {
  isOpen: boolean;
  empenho: EmpenhoList | null;
  handleClose: () => void;
  handleSubmit: () => void;
}

interface FormState {
  numero: string;
  description: string;
  category: EmpenhoCategory | "";
  startAt: string;
  endAt: string;
  value: string;
  contrato_id: string;
}

const CATEGORY_OPTIONS: { value: EmpenhoCategory; label: string }[] = [
  { value: "MANUTENCAO_PREDIAL", label: "Manutenção Predial" },
  { value: "ALIMENTACAO", label: "Alimentação" },
  { value: "HOSPITALAR", label: "Hospitalar" },
  { value: "COMBUSTIVEL", label: "Combustível" },
  { value: "TECNOLOGIA", label: "Tecnologia" },
  { value: "LIMPEZA_CONSERVACAO", label: "Limpeza e Conservação" },
  { value: "SEGURANCA_VIGILANCIA", label: "Segurança e Vigilância" },
  { value: "OUTROS", label: "Outros" },
];

export function EmpenhoModal({
  isOpen,
  empenho,
  handleClose,
}: EmpenhoModalProps) {
  const { data: contratosData, fetchContratos } = useContratos();
  const contratos = contratosData?.contratos ?? [];
  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    numero: "",
    description: "",
    category: "",
    startAt: "",
    endAt: "",
    value: "",
    contrato_id: "",
  });

  const { fetchListEmpenhos, updateStatus } = useEmpenhos();
  const [currentStatus, setCurrentStatus] = useState(
    empenho?.status || "ATIVO",
  );
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && contratos.length === 0) {
      fetchContratos();
    }
  }, [isOpen, contratos.length, fetchContratos]);

  const selectedContrato = contratos.find((c) => c.id === formState.contrato_id);
  // Ao editar um empenho que já pertence ao contrato selecionado, o saldo já
  // calculado no store desconta o valor atual desse empenho — soma de volta pra
  // refletir o que o backend realmente considera disponível nessa edição.
  const saldoDisponivelParaEmpenho =
    selectedContrato && empenho && empenho.contrato_id === selectedContrato.id
      ? selectedContrato.saldoDisponivel + empenho.value
      : (selectedContrato?.saldoDisponivel ?? 0);

  useEffect(() => {
    if (empenho) {
      setCurrentStatus(empenho.status);
    }
  }, [empenho]);

  useEffect(() => {
    if (empenho) {
      const formatDate = (d: Date | string) =>
        (d instanceof Date ? d : new Date(d)).toISOString().split("T")[0];

      setFormState({
        numero: empenho.numero.toString(),
        description: empenho.description,
        category: empenho.category,
        startAt: formatDate(empenho.startAt),
        endAt: formatDate(empenho.endAt),
        value: formatValueToCurrencyMask(empenho.value),
        contrato_id: empenho.contrato_id,
      });
    } else {
      setFormState({
        numero: "",
        description: "",
        category: "",
        startAt: "",
        endAt: "",
        value: "",
        contrato_id: "",
      });
    }
  }, [empenho]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: name === "value" ? maskCurrency(value) : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!formState.numero || !formState.description || !formState.category || !formState.value) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!formState.contrato_id) {
      toast.error("Selecione um contrato");
      return;
    }

    const numericValue = parseCurrencyMask(formState.value);
    if (numericValue <= 0) {
      toast.error("Valor deve ser um número válido maior que zero");
      return;
    }

    if (new Date(formState.startAt) > new Date(formState.endAt)) {
      toast.error("Data de início deve ser menor que a data de término");
      return;
    }

    const payload = { ...formState, value: numericValue };

    try {
      setIsLoading(true);

      if (empenho) {
        const response = await defaultFetch(`/empenho/update/${empenho.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || "Erro ao atualizar empenho");
          throw new Error("Erro ao atualizar empenho");
        }

        await fetchListEmpenhos();
        toast.info(`Empenho ${data.numero} atualizado com sucesso!`);
      } else {
        const response = await defaultFetch("/empenho/create", {
          method: "POST",
          body: JSON.stringify(payload),
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || "Erro ao criar empenho");
          throw new Error("Erro ao criar empenho");
        }

        await fetchListEmpenhos();
        toast.info(`Empenho ${data.numero} criado com sucesso!`);
      }

      handleClose();
    } catch (error) {
      throw new Error("Erro no Empenho Modal" + error);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-linear-to-r from-primary-50/50 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Receipt size={20} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                {empenho ? "Editar Empenho" : "Novo Empenho"}
              </h2>
              <p className="text-sm text-text-secondary">
                {empenho
                  ? "Atualize os dados do empenho"
                  : "Preencha os dados para criar um novo empenho"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 cursor-pointer hover:bg-surface-muted rounded-lg transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <form className="p-5 overflow-y-auto space-y-5" onSubmit={handleSubmit}>
          {/* Seção: Identificação */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Hash size={16} className="text-primary-500" />
              <span>Identificação</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Número do Empenho <span className="text-danger-text">*</span>
                </label>
                <div className="relative">
                  <Hash
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="text"
                    name="numero"
                    value={formState.numero}
                    onChange={handleChange}
                    placeholder="NE2028003"
                    className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Valor <span className="text-danger-text">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-medium">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    name="value"
                    value={formState.value}
                    onChange={handleChange}
                    placeholder="0,00"
                    className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Categoria <span className="text-danger-text">*</span>
              </label>
              <div className="relative">
                <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <select
                  name="category"
                  value={formState.category}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Selecione uma categoria</option>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Seção: Contrato */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <FileSignature size={16} className="text-primary-500" />
              <span>Contrato</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Contrato <span className="text-danger-text">*</span>
              </label>
              <div className="relative">
                <FileSignature
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <select
                  name="contrato_id"
                  value={formState.contrato_id}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Selecione um contrato</option>
                  {contratos.map((contrato) => (
                    <option key={contrato.id} value={contrato.id}>
                      {contrato.identificador} — {contrato.descricaoCurta} ({contrato.company.name})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-text-muted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              {selectedContrato && (
                <p className="text-xs text-text-muted mt-1.5">
                  Saldo disponível:{" "}
                  <span className={saldoDisponivelParaEmpenho <= 0 ? "text-danger-text font-medium" : "text-success-text font-medium"}>
                    {formatCurrency(saldoDisponivelParaEmpenho)}
                  </span>{" "}
                  de {formatCurrency(selectedContrato.valor)}
                </p>
              )}
            </div>
          </div>

          {/* Seção: Descrição */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <AlignLeft size={16} className="text-primary-500" />
              <span>Descrição</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div>
              <textarea
                name="description"
                value={formState.description}
                onChange={handleChange}
                placeholder="Descreva o objeto do empenho e os serviços contratados..."
                rows={3}
                className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all resize-none"
              />
            </div>
          </div>

          {/* Seção: Período */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <CalendarDays size={16} className="text-primary-500" />
              <span>Período de Vigência</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Data do Empenho
                </label>
                <input
                  type="date"
                  name="startAt"
                  value={formState.startAt}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Data Limite
                </label>
                <input
                  type="date"
                  name="endAt"
                  value={formState.endAt}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Seção: Status e Ações (apenas em edição) */}
          {empenho && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <AlertCircle size={16} className="text-primary-500" />
                <span>Status e Ações</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="bg-surface rounded-lg p-4 border border-border">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-text-secondary mr-2">
                    Status:
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      setUpdatingStatus("ATIVO");
                      await updateStatus({
                        status: "ATIVO",
                        empenhoId: empenho.id,
                      });
                      setCurrentStatus("ATIVO");
                      await fetchListEmpenhos();
                      setUpdatingStatus(null);
                    }}
                    disabled={updatingStatus !== null}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${currentStatus === "ATIVO" ? "bg-emerald-500 text-white border-emerald-500" : "bg-surface text-text-secondary border-border hover:border-emerald-300 hover:text-emerald-600"} ${updatingStatus !== null ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {updatingStatus === "ATIVO" ? (
                      <Loader size={14} className="animate-spin" />
                    ) : (
                      <Activity size={14} />
                    )}
                    Ativo
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setUpdatingStatus("FINALIZADO");
                      await updateStatus({
                        status: "FINALIZADO",
                        empenhoId: empenho.id,
                      });
                      setCurrentStatus("FINALIZADO");
                      await fetchListEmpenhos();
                      setUpdatingStatus(null);
                    }}
                    disabled={updatingStatus !== null}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${currentStatus === "FINALIZADO" ? "bg-primary-500 text-white border-primary-500" : "bg-surface text-text-secondary border-border hover:border-primary-300 hover:text-primary-600"} ${updatingStatus !== null ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {updatingStatus === "FINALIZADO" ? (
                      <Loader size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    Finalizado
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setUpdatingStatus("CANCELADO");
                      await updateStatus({
                        status: "CANCELADO",
                        empenhoId: empenho.id,
                      });
                      setCurrentStatus("CANCELADO");
                      await fetchListEmpenhos();
                      setUpdatingStatus(null);
                    }}
                    disabled={updatingStatus !== null}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${currentStatus === "CANCELADO" ? "bg-red-500 text-white border-red-500" : "bg-surface text-text-secondary border-border hover:border-red-300 hover:text-red-600"} ${updatingStatus !== null ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {updatingStatus === "CANCELADO" ? (
                      <Loader size={14} className="animate-spin" />
                    ) : (
                      <XCircle size={14} />
                    )}
                    Cancelado
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border shrink-0">
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
              className="flex items-center justify-center px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader className="animate-spin" size={18} />
              ) : empenho ? (
                "Salvar Alterações"
              ) : (
                "Criar Empenho"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
