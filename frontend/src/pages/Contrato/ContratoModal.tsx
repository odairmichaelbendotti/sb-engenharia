import {
  X,
  FileSignature,
  Hash,
  Building2,
  CalendarDays,
  DollarSign,
  Loader,
  Activity,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useCompanies } from "../../store/companies";
import { useContratos } from "../../store/contratos";
import { formatCurrency } from "../../utils/format-currency";
import { maskCurrency, formatValueToCurrencyMask, parseCurrencyMask } from "../../utils/masks";
import type { Contrato, ContratoStatus, CreateContratoPayload } from "../../../types/contrato";

interface ContratoModalProps {
  contrato: Contrato | null;
  handleClose: () => void;
}

const STATUS_OPTIONS: { value: ContratoStatus; label: string; icon: React.ElementType; activeClass: string; hoverClass: string }[] = [
  { value: "ATIVO", label: "Ativo", icon: Activity, activeClass: "bg-warning-text text-white border-warning-text", hoverClass: "hover:border-warning-border hover:text-warning-text" },
  { value: "FINALIZADO", label: "Finalizado", icon: CheckCircle2, activeClass: "bg-success-text text-white border-success-text", hoverClass: "hover:border-success-border hover:text-success-text" },
  { value: "CANCELADO", label: "Cancelado", icon: XCircle, activeClass: "bg-danger-text text-white border-danger-text", hoverClass: "hover:border-danger-border hover:text-danger-text" },
];

const DESCRICAO_CURTA_MAX_LENGTH = 20;

type FormState = {
  identificador: string;
  descricaoCurta: string;
  valor: string;
  dataInicio: string;
  dataFim: string;
  company_id: string;
};

const emptyForm: FormState = {
  identificador: "",
  descricaoCurta: "",
  valor: "",
  dataInicio: "",
  dataFim: "",
  company_id: "",
};

function toDateInput(d: Date | string | undefined) {
  if (!d) return "";
  return (d instanceof Date ? d : new Date(d)).toISOString().split("T")[0];
}

const inputClass =
  "w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all";

const iconInputClass =
  "w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all";

export function ContratoModal({ contrato, handleClose }: ContratoModalProps) {
  const { companies, listCompanies } = useCompanies();
  const { createContrato, updateContrato, updateContratoStatus, fetchContratos } = useContratos();
  const [isLoading, setIsLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<ContratoStatus | null>(null);
  const [currentStatus, setCurrentStatus] = useState<ContratoStatus>(contrato?.status ?? "ATIVO");
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (companies.length === 0) listCompanies();
  }, [companies.length, listCompanies]);

  useEffect(() => {
    if (contrato) {
      setCurrentStatus(contrato.status);
      setForm({
        identificador: contrato.identificador,
        descricaoCurta: contrato.descricaoCurta,
        valor: formatValueToCurrencyMask(contrato.valor),
        dataInicio: toDateInput(contrato.dataInicio),
        dataFim: toDateInput(contrato.dataFim),
        company_id: contrato.company_id,
      });
    } else {
      setForm(emptyForm);
      setCurrentStatus("ATIVO");
    }
  }, [contrato]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "valor" ? maskCurrency(value) : value }));
  }

  async function handleStatusChange(status: ContratoStatus) {
    if (!contrato) return;
    setUpdatingStatus(status);
    try {
      await updateContratoStatus(contrato.id, status);
      setCurrentStatus(status);
      toast.success(`Status atualizado para "${status}"`);
    } catch {
      toast.error("Erro ao atualizar status");
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.identificador || !form.descricaoCurta || !form.valor || !form.dataInicio || !form.dataFim || !form.company_id) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (form.descricaoCurta.length > DESCRICAO_CURTA_MAX_LENGTH) {
      toast.error(`A descrição curta deve ter no máximo ${DESCRICAO_CURTA_MAX_LENGTH} caracteres`);
      return;
    }

    const valorNum = parseCurrencyMask(form.valor);
    if (valorNum <= 0) {
      toast.error("Valor inválido");
      return;
    }

    if (new Date(form.dataInicio) >= new Date(form.dataFim)) {
      toast.error("A data de início deve ser anterior à data de fim");
      return;
    }

    const payload: CreateContratoPayload = {
      identificador: form.identificador,
      descricaoCurta: form.descricaoCurta,
      valor: valorNum.toString(),
      dataInicio: form.dataInicio,
      dataFim: form.dataFim,
      company_id: form.company_id,
    };

    try {
      setIsLoading(true);
      if (contrato) {
        await updateContrato(contrato.id, payload);
        toast.success(`Contrato "${form.identificador}" atualizado com sucesso!`);
      } else {
        await createContrato(payload);
        toast.success(`Contrato "${form.identificador}" criado com sucesso!`);
      }
      await fetchContratos();
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
              <FileSignature size={20} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                {contrato ? "Editar Contrato" : "Novo Contrato"}
              </h2>
              <p className="text-sm text-text-secondary">
                {contrato ? `Editando: ${contrato.identificador}` : "Preencha os dados para cadastrar o contrato"}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Identificador <span className="text-danger-text">*</span>
                </label>
                <div className="relative">
                  <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    name="identificador"
                    value={form.identificador}
                    onChange={handleChange}
                    placeholder="02/BAFL/2026"
                    className={iconInputClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Descrição curta <span className="text-danger-text">*</span>
                  <span className="text-text-muted font-normal"> ({form.descricaoCurta.length}/{DESCRICAO_CURTA_MAX_LENGTH})</span>
                </label>
                <input
                  name="descricaoCurta"
                  value={form.descricaoCurta}
                  onChange={handleChange}
                  maxLength={DESCRICAO_CURTA_MAX_LENGTH}
                  placeholder="Manutenção Predial"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Empresa */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Building2 size={16} className="text-primary-500" />
              <span>Empresa</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Empresa <span className="text-danger-text">*</span>
              </label>
              <select name="company_id" value={form.company_id} onChange={handleChange} className={`${inputClass} cursor-pointer`}>
                <option value="">Selecione uma empresa</option>
                {companies.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.name} - {empresa.cnpj}
                  </option>
                ))}
              </select>
            </div>
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
                Valor do Contrato (R$) <span className="text-danger-text">*</span>
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
            </div>
            {contrato && (
              <div className="bg-surface-muted rounded-lg p-3 border border-border flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-text-muted">Empenhado</p>
                  <p className="text-sm font-semibold text-text-primary">{formatCurrency(contrato.valorEmpenhado)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">Saldo disponível</p>
                  <p className={`text-sm font-semibold ${contrato.saldoDisponivel <= 0 ? "text-danger-text" : "text-success-text"}`}>
                    {formatCurrency(contrato.saldoDisponivel)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Vigência */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <CalendarDays size={16} className="text-primary-500" />
              <span>Vigência</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Data de Início <span className="text-danger-text">*</span>
                </label>
                <input type="date" name="dataInicio" value={form.dataInicio} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Data de Fim <span className="text-danger-text">*</span>
                </label>
                <input type="date" name="dataFim" value={form.dataFim} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Status (somente edição) */}
          {contrato && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <Activity size={16} className="text-primary-500" />
                <span>Status do Contrato</span>
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
              ) : contrato ? (
                "Salvar Alterações"
              ) : (
                "Cadastrar Contrato"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
