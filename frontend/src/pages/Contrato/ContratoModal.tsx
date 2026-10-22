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
  FileText,
  Layers2,
  ShieldCheck,
  Plus,
  Trash2,
  MapPin,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useCompanies } from "../../store/companies";
import { useContratos } from "../../store/contratos";
import { formatCurrency } from "../../utils/format-currency";
import { maskCnpj, maskCurrency, formatValueToCurrencyMask, parseCurrencyMask } from "../../utils/masks";
import {
  PLACEHOLDER_A_PREENCHER,
  type Contrato,
  type ContratoStatus,
  type CreateContratoPayload,
  type FiscalTipo,
} from "../../../types/contrato";
import { createBlurNormalizer, CONTRATO_FIELD_RULES } from "../../utils/normalization/form-rules";

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

// BDI padrão dos contratos da BAFL
const DEFAULT_BDI = "21,19";

type FormState = {
  identificador: string;
  descricaoCurta: string;
  valor: string;
  dataInicio: string;
  dataFim: string;
  company_id: string;
  ePag: string;
  etp: string;
  termoReferencia: string;
  dataBaseSinapi: string;
  endereco: string;
  bdi: string;
};

const emptyForm: FormState = {
  identificador: "",
  descricaoCurta: "",
  valor: "",
  dataInicio: "",
  dataFim: "",
  company_id: "",
  ePag: "",
  etp: "",
  termoReferencia: "",
  dataBaseSinapi: "",
  endereco: "",
  bdi: DEFAULT_BDI,
};

// Linhas das listas de lotes e de fiscais (a `key` só serve para o React)
type LoteForm = { key: number; id?: string; numero: string; nome: string; desconto: string };
type FiscalForm = { key: number; id?: string; tipo: FiscalTipo; nome: string; ramal: string; email: string };

const FISCAL_TIPO_LABEL: Record<FiscalTipo, string> = {
  TECNICO: "Técnico",
  ADMINISTRATIVO: "Administrativo",
};

// Contrato antigo traz "A PREENCHER": o campo abre vazio para ser preenchido de verdade
function fromStored(value: string) {
  return value === PLACEHOLDER_A_PREENCHER ? "" : value;
}

// Número digitado com vírgula ("24,8") → número
function parseDecimal(value: string) {
  return parseFloat(value.replace(",", "."));
}

function toDecimalInput(value: number) {
  return String(value).replace(".", ",");
}

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
  const nextKey = useRef(0);
  const [lotes, setLotes] = useState<LoteForm[]>([]);
  const [fiscais, setFiscais] = useState<FiscalForm[]>([]);

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
        ePag: fromStored(contrato.ePag),
        etp: fromStored(contrato.etp),
        termoReferencia: fromStored(contrato.termoReferencia),
        dataBaseSinapi: fromStored(contrato.dataBaseSinapi),
        endereco: fromStored(contrato.endereco),
        bdi: toDecimalInput(contrato.bdi),
      });
      setLotes(
        contrato.lotes.map((l) => ({
          key: nextKey.current++,
          id: l.id,
          numero: String(l.numero),
          nome: l.nome,
          desconto: toDecimalInput(l.desconto),
        })),
      );
      setFiscais(contrato.fiscais.map((f) => ({ key: nextKey.current++, ...f })));
    } else {
      setForm(emptyForm);
      setLotes([]);
      setFiscais([]);
      setCurrentStatus("ATIVO");
    }
  }, [contrato]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "valor" ? maskCurrency(value) : value }));
  }

  function updateLote(key: number, changes: Partial<LoteForm>) {
    setLotes((prev) => prev.map((l) => (l.key === key ? { ...l, ...changes } : l)));
  }

  function addLote() {
    // Sugere o próximo número de lote
    const proximo = Math.max(0, ...lotes.map((l) => parseInt(l.numero, 10) || 0)) + 1;
    setLotes((prev) => [...prev, { key: nextKey.current++, numero: String(proximo), nome: "", desconto: "" }]);
  }

  function updateFiscal(key: number, changes: Partial<FiscalForm>) {
    setFiscais((prev) => prev.map((f) => (f.key === key ? { ...f, ...changes } : f)));
  }

  function addFiscal(tipo: FiscalTipo) {
    setFiscais((prev) => [...prev, { key: nextKey.current++, tipo, nome: "", ramal: "", email: "" }]);
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

    if (!form.ePag || !form.etp || !form.termoReferencia || !form.dataBaseSinapi || !form.endereco) {
      toast.error("Preencha os dados da ordem de serviço: e-PAG, ETP, TR, data-base SINAPI e endereço");
      return;
    }

    const bdiNum = parseDecimal(form.bdi);
    if (isNaN(bdiNum) || bdiNum < 0 || bdiNum >= 100) {
      toast.error("BDI inválido (use um valor entre 0 e 100)");
      return;
    }

    const lotesPayload: CreateContratoPayload["lotes"] = [];
    for (const lote of lotes) {
      const numero = parseInt(lote.numero, 10);
      const desconto = parseDecimal(lote.desconto);
      if (!numero || numero < 1 || !lote.nome.trim() || isNaN(desconto) || desconto < 0 || desconto >= 100) {
        toast.error("Informe número, nome e desconto (de 0 a 100%) de cada lote");
        return;
      }
      if (lotesPayload.some((l) => l.numero === numero)) {
        toast.error(`O lote ${numero} está repetido`);
        return;
      }
      lotesPayload.push({ ...(lote.id ? { id: lote.id } : {}), numero, nome: lote.nome, desconto });
    }

    if (fiscais.some((f) => !f.nome.trim() || !f.ramal.trim() || !f.email.trim())) {
      toast.error("Informe nome, ramal e e-mail de cada fiscal");
      return;
    }

    const payload: CreateContratoPayload = {
      identificador: form.identificador,
      descricaoCurta: form.descricaoCurta,
      valor: valorNum.toString(),
      dataInicio: form.dataInicio,
      dataFim: form.dataFim,
      company_id: form.company_id,
      ePag: form.ePag,
      etp: form.etp,
      termoReferencia: form.termoReferencia,
      dataBaseSinapi: form.dataBaseSinapi,
      endereco: form.endereco,
      bdi: bdiNum,
      lotes: lotesPayload,
      fiscais: fiscais.map(({ id, tipo, nome, ramal, email }) => ({ ...(id ? { id } : {}), tipo, nome, ramal, email })),
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

        <form onBlur={createBlurNormalizer(setForm, CONTRATO_FIELD_RULES)} className="p-5 overflow-y-auto space-y-5" onSubmit={handleSubmit}>
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
                    {empresa.name} - {maskCnpj(empresa.cnpj)}
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
              <div className="bg-surface-muted rounded-lg p-3 border border-border grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-text-muted">Empenhado</p>
                  <p className="text-sm font-semibold text-text-primary">{formatCurrency(contrato.valorEmpenhado)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Saldo a empenhar</p>
                  <p className="text-sm font-semibold text-text-primary">{formatCurrency(contrato.saldoDisponivel)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Liquidado (NFs)</p>
                  <p className="text-sm font-semibold text-text-primary">{formatCurrency(contrato.valorLiquidado)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Saldo a liquidar</p>
                  <p className="text-sm font-semibold text-text-primary">{formatCurrency(contrato.saldoALiquidar)}</p>
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

          {/* Dados da Ordem de Serviço */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <FileText size={16} className="text-primary-500" />
              <span>Dados da Ordem de Serviço</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <p className="text-xs text-text-muted">Saem no documento de cada ordem de serviço deste contrato.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  e-PAG <span className="text-danger-text">*</span>
                </label>
                <input name="ePag" value={form.ePag} onChange={handleChange} placeholder="67272.002300/2026-41" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  ETP <span className="text-danger-text">*</span>
                </label>
                <input name="etp" value={form.etp} onChange={handleChange} placeholder="79/2025" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Termo de Referência (TR) <span className="text-danger-text">*</span>
                </label>
                <input
                  name="termoReferencia"
                  value={form.termoReferencia}
                  onChange={handleChange}
                  placeholder="26/2026"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Data-base SINAPI <span className="text-danger-text">*</span>
                </label>
                <input
                  name="dataBaseSinapi"
                  value={form.dataBaseSinapi}
                  onChange={handleChange}
                  placeholder="Maio/2026 - Florianópolis (Não Desonerada)"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  BDI (%) <span className="text-danger-text">*</span>
                </label>
                <input
                  name="bdi"
                  inputMode="decimal"
                  value={form.bdi}
                  onChange={(e) => setForm((prev) => ({ ...prev, bdi: e.target.value.replace(/[^\d,]/g, "") }))}
                  placeholder="21,19"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Endereço do local dos serviços <span className="text-danger-text">*</span>
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  name="endereco"
                  value={form.endereco}
                  onChange={handleChange}
                  placeholder="Base Aérea de Florianópolis - Av. Santos Dumont, s/n, CEP 88049-000"
                  className={iconInputClass}
                />
              </div>
            </div>
          </div>

          {/* Lotes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Layers2 size={16} className="text-primary-500" />
              <span>Lotes</span>
              <span className="text-xs font-normal text-text-muted">(opcional)</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <p className="text-xs text-text-muted">
              Cadastre os lotes se a licitação teve desconto por lote: toda ordem de serviço do contrato escolhe um deles.
            </p>
            {lotes.map((lote) => (
              <div key={lote.key} className="grid grid-cols-[4.5rem_1fr_6.5rem_auto] gap-2 items-center">
                <input
                  aria-label="Número do lote"
                  inputMode="numeric"
                  value={lote.numero}
                  onChange={(e) => updateLote(lote.key, { numero: e.target.value.replace(/\D/g, "") })}
                  placeholder="Nº"
                  className={inputClass}
                />
                <input
                  aria-label="Nome do lote"
                  value={lote.nome}
                  onChange={(e) => updateLote(lote.key, { nome: e.target.value })}
                  placeholder="Nome (ex.: DO)"
                  className={inputClass}
                />
                <div className="relative">
                  <input
                    aria-label="Desconto do lote (%)"
                    inputMode="decimal"
                    value={lote.desconto}
                    onChange={(e) => updateLote(lote.key, { desconto: e.target.value.replace(/[^\d,]/g, "") })}
                    placeholder="24,8"
                    className={`${inputClass} pr-7`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">%</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLotes((prev) => prev.filter((l) => l.key !== lote.key))}
                  title="Remover lote"
                  className="p-2.5 cursor-pointer text-text-secondary hover:bg-danger-bg hover:text-danger-text rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addLote}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 border border-primary-200 bg-primary-50 hover:bg-primary-100 rounded-md cursor-pointer transition-colors"
            >
              <Plus size={14} />
              Adicionar lote
            </button>
          </div>

          {/* Fiscais */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <ShieldCheck size={16} className="text-primary-500" />
              <span>Fiscais do contrato</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <p className="text-xs text-text-muted">
              Cada ordem de serviço escolhe, entre estes, o fiscal técnico e o administrativo. Cadastre ao menos um de
              cada tipo para poder emitir OS.
            </p>
            {fiscais.map((fiscal) => (
              <div key={fiscal.key} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <select
                    aria-label="Tipo do fiscal"
                    value={fiscal.tipo}
                    onChange={(e) => updateFiscal(fiscal.key, { tipo: e.target.value as FiscalTipo })}
                    className={`${inputClass} w-auto cursor-pointer`}
                  >
                    {(Object.keys(FISCAL_TIPO_LABEL) as FiscalTipo[]).map((tipo) => (
                      <option key={tipo} value={tipo}>
                        Fiscal {FISCAL_TIPO_LABEL[tipo]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setFiscais((prev) => prev.filter((f) => f.key !== fiscal.key))}
                    title="Remover fiscal"
                    className="p-2 cursor-pointer text-text-secondary hover:bg-danger-bg hover:text-danger-text rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_6rem_1fr] gap-2">
                  <input
                    aria-label="Posto e nome do fiscal"
                    value={fiscal.nome}
                    onChange={(e) => updateFiscal(fiscal.key, { nome: e.target.value })}
                    placeholder="Posto e nome (ex.: 1º SGT FLORIANO)"
                    className={inputClass}
                  />
                  <input
                    aria-label="Ramal do fiscal"
                    value={fiscal.ramal}
                    onChange={(e) => updateFiscal(fiscal.key, { ramal: e.target.value })}
                    placeholder="Ramal"
                    className={inputClass}
                  />
                  <input
                    aria-label="E-mail do fiscal"
                    type="email"
                    value={fiscal.email}
                    onChange={(e) => updateFiscal(fiscal.key, { email: e.target.value })}
                    placeholder="e-mail@fab.mil.br"
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              {(Object.keys(FISCAL_TIPO_LABEL) as FiscalTipo[]).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => addFiscal(tipo)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 border border-primary-200 bg-primary-50 hover:bg-primary-100 rounded-md cursor-pointer transition-colors"
                >
                  <Plus size={14} />
                  Fiscal {FISCAL_TIPO_LABEL[tipo].toLowerCase()}
                </button>
              ))}
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
