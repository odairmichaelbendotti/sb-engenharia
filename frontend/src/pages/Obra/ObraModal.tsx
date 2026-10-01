import {
  X,
  HardHat,
  Hash,
  AlignLeft,
  MapPin,
  User,
  Loader,
  Activity,
  CheckCircle2,
  PauseCircle,
  XCircle,
  FileText,
  FileSignature,
  Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useObras } from "../../store/obras";
import { useOrdensServico } from "../../store/ordensServico";
import type { Obra, ObraStatus, CreateObraPayload } from "../../../types/obra";
import { createBlurNormalizer, OBRA_FIELD_RULES } from "../../utils/normalization/form-rules";
import { formatCurrency, formatDateOnly } from "../../utils/format-currency";

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
  { value: "MANUTENCAO_PREDIAL", label: "Manutenção Predial" },
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
  identificacaoPatrimonial: string;
  tipo: string;
  descricao: string;
  latitude: string;
  longitude: string;
  responsavelTecnico: string;
  anotacoes: string;
};

const emptyForm: FormState = {
  nome: "",
  identificacaoPatrimonial: "",
  tipo: "CONSTRUCAO",
  descricao: "",
  latitude: "",
  longitude: "",
  responsavelTecnico: "",
  anotacoes: "",
};

// OS vinculada à obra no formulário (as atuais da obra e as recém-escolhidas)
type LinkedOrdemServico = {
  id: string;
  numero: string;
  valor: number;
  dataInicio: string | null;
  dataPrevisaoTermino: string | null;
  contrato: string;
  // Só OS sem notas fiscais podem sair da obra
  valorExecutado: number;
};

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
  const { options: ordemServicoOptions, fetchOrdemServicoOptions } = useOrdensServico();
  const [isLoading, setIsLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<ObraStatus | null>(null);
  const [currentStatus, setCurrentStatus] = useState<ObraStatus>(obra?.status ?? "EM_ANDAMENTO");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [linked, setLinked] = useState<LinkedOrdemServico[]>(() =>
    (obra?.ordensServico ?? []).map((os) => ({
      id: os.id,
      numero: os.numero,
      valor: os.valor,
      dataInicio: os.dataInicio,
      dataPrevisaoTermino: os.dataPrevisaoTermino,
      contrato: `${os.contrato.identificador} · ${os.contrato.company.name}`,
      valorExecutado: os.valorExecutado,
    })),
  );

  // OS ativas ainda sem obra, para vincular
  useEffect(() => {
    fetchOrdemServicoOptions().catch(() => toast.error("Erro ao carregar as ordens de serviço"));
  }, [fetchOrdemServicoOptions]);

  const availableOptions = ordemServicoOptions.filter((os) => !linked.some((l) => l.id === os.id));

  useEffect(() => {
    if (obra) {
      setCurrentStatus(obra.status);
      setForm({
        nome: obra.nome,
        identificacaoPatrimonial: obra.identificacaoPatrimonial,
        tipo: obra.tipo,
        descricao: obra.descricao,
        latitude: obra.latitude !== undefined ? String(obra.latitude) : "",
        longitude: obra.longitude !== undefined ? String(obra.longitude) : "",
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

  function handleLinkOrdemServico(id: string) {
    const os = ordemServicoOptions.find((o) => o.id === id);
    if (!os) return;
    setLinked((prev) => [
      ...prev,
      {
        id: os.id,
        numero: os.numero,
        valor: os.valor,
        dataInicio: os.dataInicio,
        dataPrevisaoTermino: os.dataPrevisaoTermino,
        contrato: `${os.empenho.contrato.identificador} · ${os.empenho.contrato.company.name}`,
        valorExecutado: 0,
      },
    ]);
  }

  function handleUnlinkOrdemServico(id: string) {
    setLinked((prev) => prev.filter((l) => l.id !== id));
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

    if (!form.nome || !form.identificacaoPatrimonial || !form.responsavelTecnico) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (linked.length === 0) {
      toast.error("Vincule ao menos uma ordem de serviço a esta obra");
      return;
    }

    const latitudeNum = form.latitude.trim() ? parseFloat(form.latitude) : undefined;
    const longitudeNum = form.longitude.trim() ? parseFloat(form.longitude) : undefined;
    if ((latitudeNum !== undefined && isNaN(latitudeNum)) || (longitudeNum !== undefined && isNaN(longitudeNum))) {
      toast.error("Latitude/Longitude inválidas");
      return;
    }

    const payload: CreateObraPayload = {
      nome: form.nome,
      identificacaoPatrimonial: form.identificacaoPatrimonial,
      tipo: form.tipo as CreateObraPayload["tipo"],
      descricao: form.descricao,
      latitude: latitudeNum?.toString(),
      longitude: longitudeNum?.toString(),
      responsavelTecnico: form.responsavelTecnico,
      anotacoes: form.anotacoes || undefined,
      ordemServico_ids: linked.map((l) => l.id),
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-linear-to-r from-primary-50/50 to-transparent shrink-0">
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

        <form onBlur={createBlurNormalizer(setForm, OBRA_FIELD_RULES)} className="p-5 overflow-y-auto space-y-5" onSubmit={handleSubmit}>
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
              <InputField label="Identificação Patrimonial" required>
                <div className="relative">
                  <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    name="identificacaoPatrimonial"
                    value={form.identificacaoPatrimonial}
                    onChange={handleChange}
                    placeholder="E-027"
                    className={iconInputClass}
                  />
                </div>
              </InputField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Tipo de Obra" required>
                <select name="tipo" value={form.tipo} onChange={handleChange} className={`${inputClass} cursor-pointer`}>
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

          {/* Ordens de serviço da obra (uma obra pode ter várias) */}
          <div className="space-y-3">
            <SectionTitle icon={FileSignature} label="Ordens de Serviço" />
            <p className="text-xs text-text-muted">
              O cronograma e o orçamento da obra vêm das OS vinculadas. Faltou um serviço? Emita uma nova OS e vincule-a
              aqui.
            </p>

            {linked.length > 0 && (
              <ul className="space-y-2">
                {linked.map((os) => {
                  const lockedReason =
                    linked.length === 1
                      ? "A obra precisa ter ao menos uma OS"
                      : os.valorExecutado > 0
                        ? "Esta OS já tem notas fiscais lançadas"
                        : null;
                  return (
                    <li
                      key={os.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary">
                          OS {os.numero} <span className="text-text-muted font-normal">· {formatCurrency(os.valor)}</span>
                        </p>
                        <p className="text-xs text-text-secondary truncate">
                          {os.contrato}
                          {os.dataInicio && os.dataPrevisaoTermino
                            ? ` · ${formatDateOnly(os.dataInicio)} a ${formatDateOnly(os.dataPrevisaoTermino)}`
                            : " · sem prazo definido"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnlinkOrdemServico(os.id)}
                        disabled={lockedReason !== null}
                        title={lockedReason ?? "Retirar OS da obra"}
                        className="p-2 cursor-pointer text-text-secondary hover:bg-danger-bg hover:text-danger-text rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <InputField
              label={linked.length === 0 ? "Ordem de Serviço" : "Vincular outra ordem de serviço"}
              required={linked.length === 0}
            >
              <select
                value=""
                onChange={(e) => handleLinkOrdemServico(e.target.value)}
                disabled={availableOptions.length === 0}
                className={`${inputClass} cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <option value="">
                  {availableOptions.length === 0 ? "Nenhuma OS ativa sem obra" : "Selecione uma ordem de serviço"}
                </option>
                {availableOptions.map((os) => (
                  <option key={os.id} value={os.id}>
                    {os.numero} — {os.empenhos.length > 1 ? "Empenhos" : "Empenho"}{" "}
                    {os.empenhos.map((v) => v.numero).join(", ")} — {os.empenho.contrato.identificador}
                  </option>
                ))}
              </select>
              {availableOptions.length === 0 && linked.length === 0 && (
                <p className="text-xs text-warning-text mt-1">
                  Não há ordens de serviço disponíveis para vincular. Cadastre uma em Administrativo &gt; Ordens de Serviço.
                </p>
              )}
            </InputField>
          </div>

          {/* Localização (coordenadas do mapa — endereço vem do tenant) */}
          <div className="space-y-4">
            <SectionTitle icon={MapPin} label="Localização" />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Latitude">
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={form.latitude}
                  onChange={handleChange}
                  placeholder="-15.7801"
                  className={inputClass}
                />
              </InputField>
              <InputField label="Longitude">
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={form.longitude}
                  onChange={handleChange}
                  placeholder="-47.9292"
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
              className="flex items-center justify-center gap-2 px-5 py-2.5 cursor-pointer bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
