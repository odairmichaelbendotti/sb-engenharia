import {
  X,
  HardHat,
  Hash,
  AlignLeft,
  MapPin,
  CalendarDays,
  User,
  DollarSign,
  Loader,
  Activity,
  CheckCircle2,
  PauseCircle,
  XCircle,
  FileText,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useObras } from "../../store/obras";
import type { Obra, ObraStatus, CreateObraPayload } from "../../../types/obra";
import { estadosBrasil } from "../../utils/estados-brasil";

interface ObraModalProps {
  obra: Obra | null;
  handleClose: () => void;
}

const TIPOS = [
  { value: "CONSTRUCAO", label: "Construção" },
  { value: "REFORMA", label: "Reforma" },
  { value: "AMPLIACAO", label: "Ampliação" },
  { value: "PAVIMENTACAO", label: "Pavimentação" },
  { value: "SANEAMENTO", label: "Saneamento" },
  { value: "OUTRO", label: "Outro" },
];

const STATUS_OPTIONS: { value: ObraStatus; label: string; icon: React.ElementType; activeClass: string; hoverClass: string }[] = [
  { value: "EM_ANDAMENTO", label: "Em Andamento", icon: Activity, activeClass: "bg-warning-text text-white border-warning-text", hoverClass: "hover:border-warning-border hover:text-warning-text" },
  { value: "CONCLUIDA", label: "Concluída", icon: CheckCircle2, activeClass: "bg-success-text text-white border-success-text", hoverClass: "hover:border-success-border hover:text-success-text" },
  { value: "PARALISADA", label: "Paralisada", icon: PauseCircle, activeClass: "bg-danger-text text-white border-danger-text", hoverClass: "hover:border-danger-border hover:text-danger-text" },
  { value: "CANCELADA", label: "Cancelada", icon: XCircle, activeClass: "bg-text-secondary text-white border-text-secondary", hoverClass: "hover:border-border-strong hover:text-text-secondary" },
];

type FormState = {
  nome: string;
  codigo: string;
  tipo: string;
  descricao: string;
  logradouro: string;
  cidade: string;
  estado: string;
  orcamento: string;
  dataInicio: string;
  dataPrevisaoTermino: string;
  responsavelTecnico: string;
  anotacoes: string;
};

const emptyForm: FormState = {
  nome: "",
  codigo: "",
  tipo: "CONSTRUCAO",
  descricao: "",
  logradouro: "",
  cidade: "",
  estado: "",
  orcamento: "",
  dataInicio: "",
  dataPrevisaoTermino: "",
  responsavelTecnico: "",
  anotacoes: "",
};

function toDateInput(d: Date | string | undefined) {
  if (!d) return "";
  return (d instanceof Date ? d : new Date(d)).toISOString().split("T")[0];
}

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
      <Icon size={16} className="text-primary-500" />
      <span>{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function InputField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1.5">
        {label} {required && <span className="text-danger-text">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all";

const iconInputClass =
  "w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all";

export function ObraModal({ obra, handleClose }: ObraModalProps) {
  const { createObra, updateObra, updateObraStatus, fetchObras } = useObras();
  const [isLoading, setIsLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<ObraStatus | null>(null);
  const [currentStatus, setCurrentStatus] = useState<ObraStatus>(obra?.status ?? "EM_ANDAMENTO");
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (obra) {
      setCurrentStatus(obra.status);
      setForm({
        nome: obra.nome,
        codigo: obra.codigo,
        tipo: obra.tipo,
        descricao: obra.descricao,
        logradouro: obra.logradouro,
        cidade: obra.cidade,
        estado: obra.estado,
        orcamento: obra.orcamento.toString(),
        dataInicio: toDateInput(obra.dataInicio),
        dataPrevisaoTermino: toDateInput(obra.dataPrevisaoTermino),
        responsavelTecnico: obra.responsavelTecnico,
        anotacoes: obra.anotacoes ?? "",
      });
    } else {
      setForm(emptyForm);
      setCurrentStatus("EM_ANDAMENTO");
    }
  }, [obra]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleStatusChange(status: ObraStatus) {
    if (!obra) return;
    setUpdatingStatus(status);
    try {
      await updateObraStatus(obra.id, status);
      setCurrentStatus(status);
      toast.success(`Status atualizado para "${status.replace("_", " ")}"`);
    } catch {
      toast.error("Erro ao atualizar status");
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.nome || !form.codigo || !form.orcamento || !form.dataInicio || !form.dataPrevisaoTermino || !form.responsavelTecnico) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const orcamentoNum = parseFloat(form.orcamento.replace(/\./g, "").replace(",", "."));
    if (isNaN(orcamentoNum) || orcamentoNum <= 0) {
      toast.error("Orçamento inválido");
      return;
    }

    if (new Date(form.dataInicio) >= new Date(form.dataPrevisaoTermino)) {
      toast.error("A data de início deve ser anterior ao prazo de conclusão");
      return;
    }

    const payload: CreateObraPayload = {
      nome: form.nome,
      codigo: form.codigo,
      tipo: form.tipo as CreateObraPayload["tipo"],
      descricao: form.descricao,
      logradouro: form.logradouro,
      cidade: form.cidade,
      estado: form.estado,
      orcamento: orcamentoNum.toString(),
      dataInicio: form.dataInicio,
      dataPrevisaoTermino: form.dataPrevisaoTermino,
      responsavelTecnico: form.responsavelTecnico,
      anotacoes: form.anotacoes || undefined,
    };

    try {
      setIsLoading(true);
      if (obra) {
        await updateObra(obra.id, payload);
        toast.success(`Obra "${form.nome}" atualizada com sucesso!`);
      } else {
        await createObra(payload);
        toast.success(`Obra "${form.nome}" criada com sucesso!`);
      }
      await fetchObras();
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
      <div className="bg-surface rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-linear-to-r from-primary-50/50 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <HardHat size={20} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                {obra ? "Editar Obra" : "Nova Obra"}
              </h2>
              <p className="text-sm text-text-secondary">
                {obra ? `Editando: ${obra.nome}` : "Preencha os dados para cadastrar a obra"}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 cursor-pointer hover:bg-surface-muted rounded-lg transition-colors">
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <form className="p-6 overflow-y-auto space-y-6" onSubmit={handleSubmit}>
          {/* Identificação */}
          <div className="space-y-4">
            <SectionTitle icon={Hash} label="Identificação" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Nome da Obra" required>
                <input
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  placeholder="Ex.: Construção do Centro Comunitário"
                  className={inputClass}
                />
              </InputField>
              <InputField label="Código / ART" required>
                <div className="relative">
                  <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    name="codigo"
                    value={form.codigo}
                    onChange={handleChange}
                    placeholder="OB-2025-001"
                    className={iconInputClass}
                  />
                </div>
              </InputField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Tipo de Obra" required>
                <select name="tipo" value={form.tipo} onChange={handleChange} className={inputClass}>
                  {TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </InputField>
              <InputField label="Responsável Técnico" required>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    name="responsavelTecnico"
                    value={form.responsavelTecnico}
                    onChange={handleChange}
                    placeholder="Eng.º João Silva — CREA 12345"
                    className={iconInputClass}
                  />
                </div>
              </InputField>
            </div>
          </div>

          {/* Localização */}
          <div className="space-y-4">
            <SectionTitle icon={MapPin} label="Localização" />
            <InputField label="Logradouro">
              <input
                name="logradouro"
                value={form.logradouro}
                onChange={handleChange}
                placeholder="Rua, número, bairro"
                className={inputClass}
              />
            </InputField>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Cidade">
                <input
                  name="cidade"
                  value={form.cidade}
                  onChange={handleChange}
                  placeholder="Ex.: São Paulo"
                  className={inputClass}
                />
              </InputField>
              <InputField label="Estado">
                <select name="estado" value={form.estado} onChange={handleChange} className={inputClass}>
                  <option value="">Selecione</option>
                  {estadosBrasil.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </InputField>
            </div>
          </div>

          {/* Financeiro */}
          <div className="space-y-4">
            <SectionTitle icon={DollarSign} label="Financeiro" />
            <InputField label="Orçamento Total (R$)" required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-medium text-sm">R$</span>
                <input
                  name="orcamento"
                  value={form.orcamento}
                  onChange={handleChange}
                  placeholder="0,00"
                  className={iconInputClass}
                />
              </div>
            </InputField>
          </div>

          {/* Cronograma */}
          <div className="space-y-4">
            <SectionTitle icon={CalendarDays} label="Cronograma" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Data de Início" required>
                <input
                  type="date"
                  name="dataInicio"
                  value={form.dataInicio}
                  onChange={handleChange}
                  className={inputClass}
                />
              </InputField>
              <InputField label="Previsão de Conclusão" required>
                <input
                  type="date"
                  name="dataPrevisaoTermino"
                  value={form.dataPrevisaoTermino}
                  onChange={handleChange}
                  className={inputClass}
                />
              </InputField>
            </div>
          </div>

          {/* Descrição e Anotações */}
          <div className="space-y-4">
            <SectionTitle icon={AlignLeft} label="Detalhes Técnicos" />
            <InputField label="Descrição do Objeto">
              <textarea
                name="descricao"
                value={form.descricao}
                onChange={handleChange}
                rows={3}
                placeholder="Descreva o objeto, escopo e especificações técnicas da obra..."
                className={`${inputClass} resize-none`}
              />
            </InputField>
            <InputField label="Anotações de Campo">
              <textarea
                name="anotacoes"
                value={form.anotacoes}
                onChange={handleChange}
                rows={2}
                placeholder="Observações, intercorrências ou notas internas..."
                className={`${inputClass} resize-none`}
              />
            </InputField>
          </div>

          {/* Status (somente edição) */}
          {obra && (
            <div className="space-y-4">
              <SectionTitle icon={FileText} label="Status da Obra" />
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
              ) : obra ? (
                "Salvar Alterações"
              ) : (
                "Cadastrar Obra"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
