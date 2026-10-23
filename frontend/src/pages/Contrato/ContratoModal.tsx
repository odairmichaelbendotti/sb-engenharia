import {
  FileSignature,
  Hash,
  Building2,
  CalendarDays,
  DollarSign,
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
import { StepForm, type FormStep } from "../../components/StepForm";
import {
  Button,
  Field,
  FormSection,
  IconButton,
  Input,
  Modal,
  ModalHeader,
  SegmentedControl,
  Select,
  type SegmentOption,
} from "../../components/ui";
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

const STATUS_OPTIONS: SegmentOption<ContratoStatus>[] = [
  { value: "ATIVO", label: "Ativo", icon: Activity, tone: "info" },
  { value: "FINALIZADO", label: "Finalizado", icon: CheckCircle2, tone: "neutral" },
  { value: "CANCELADO", label: "Cancelado", icon: XCircle, tone: "neutral" },
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

  const valorNum = parseCurrencyMask(form.valor);
  const bdiNum = parseDecimal(form.bdi);

  // Validação de cada etapa: devolve a mensagem do primeiro problema ou null
  function validateIdentificacao() {
    if (!form.identificador) return "Informe o identificador do contrato";
    if (!form.descricaoCurta) return "Informe a descrição curta do contrato";
    if (form.descricaoCurta.length > DESCRICAO_CURTA_MAX_LENGTH) {
      return `A descrição curta deve ter no máximo ${DESCRICAO_CURTA_MAX_LENGTH} caracteres`;
    }
    if (!form.company_id) return "Selecione a empresa do contrato";
    return null;
  }

  function validateValores() {
    if (!form.valor || valorNum <= 0) return "Informe um valor válido para o contrato";
    if (!form.dataInicio || !form.dataFim) return "Informe o início e o fim da vigência do contrato";
    if (new Date(form.dataInicio) >= new Date(form.dataFim)) return "A data de início deve ser anterior à data de fim";
    return null;
  }

  function validateDadosOS() {
    if (!form.ePag || !form.etp || !form.termoReferencia || !form.dataBaseSinapi || !form.endereco) {
      return "Preencha os dados da ordem de serviço: e-PAG, ETP, TR, data-base SINAPI e endereço";
    }
    if (isNaN(bdiNum) || bdiNum < 0 || bdiNum >= 100) return "BDI inválido (use um valor entre 0 e 100)";
    return null;
  }

  // Lotes já em formato de envio, ou a mensagem do primeiro problema
  function buildLotes(): { lotes: CreateContratoPayload["lotes"]; error: null } | { lotes: null; error: string } {
    const result: CreateContratoPayload["lotes"] = [];
    for (const lote of lotes) {
      const numero = parseInt(lote.numero, 10);
      const desconto = parseDecimal(lote.desconto);
      if (!numero || numero < 1 || !lote.nome.trim() || isNaN(desconto) || desconto < 0 || desconto >= 100) {
        return { lotes: null, error: "Informe número, nome e desconto (de 0 a 100%) de cada lote" };
      }
      if (result.some((l) => l.numero === numero)) return { lotes: null, error: `O lote ${numero} está repetido` };
      result.push({ ...(lote.id ? { id: lote.id } : {}), numero, nome: lote.nome, desconto });
    }
    return { lotes: result, error: null };
  }

  function validateLotes() {
    return buildLotes().error;
  }

  function validateFiscais() {
    if (fiscais.some((f) => !f.nome.trim() || !f.ramal.trim() || !f.email.trim())) {
      return "Informe nome, ramal e e-mail de cada fiscal";
    }
    return null;
  }

  async function submit() {
    const built = buildLotes();
    if (built.lotes === null) return;

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
      lotes: built.lotes,
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


  const steps: FormStep[] = [
    {
      id: "identificacao",
      label: "Identificação",
      icon: Hash,
      validate: validateIdentificacao,
      content: (
        <>
          <FormSection title="Identificação" icon={Hash}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Identificador" required>
                <Input
                  icon={Hash}
                  name="identificador"
                  value={form.identificador}
                  onChange={handleChange}
                  placeholder="02/BAFL/2026"
                />
              </Field>
              <Field
                label="Descrição curta"
                required
                action={
                  <span className="text-xs text-text-muted tabular-nums">
                    ({form.descricaoCurta.length}/{DESCRICAO_CURTA_MAX_LENGTH})
                  </span>
                }
              >
                <Input
                  name="descricaoCurta"
                  value={form.descricaoCurta}
                  onChange={handleChange}
                  maxLength={DESCRICAO_CURTA_MAX_LENGTH}
                  placeholder="Manutenção Predial"
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Empresa" icon={Building2}>
            <Field label="Empresa" required>
              <Select icon={Building2} name="company_id" value={form.company_id} onChange={handleChange}>
                <option value="">Selecione uma empresa</option>
                {companies.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.name} - {maskCnpj(empresa.cnpj)}
                  </option>
                ))}
              </Select>
            </Field>
          </FormSection>
        </>
      ),
    },
    {
      id: "valores",
      label: "Valores e vigência",
      icon: DollarSign,
      validate: validateValores,
      content: (
        <>
          <FormSection title="Financeiro" icon={DollarSign}>
            <Field label="Valor do Contrato (R$)" required>
              <Input
                prefix="R$"
                name="valor"
                inputMode="numeric"
                value={form.valor}
                onChange={handleChange}
                placeholder="0,00"
              />
            </Field>
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
          </FormSection>

          <FormSection title="Vigência" icon={CalendarDays}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Data de Início" required>
                <Input type="date" name="dataInicio" value={form.dataInicio} onChange={handleChange} />
              </Field>
              <Field label="Data de Fim" required>
                <Input type="date" name="dataFim" value={form.dataFim} onChange={handleChange} />
              </Field>
            </div>
          </FormSection>
        </>
      ),
    },
    {
      id: "dados-os",
      label: "Dados da OS",
      icon: FileText,
      validate: validateDadosOS,
      content: (
        <FormSection title="Dados da Ordem de Serviço" icon={FileText}>
          <p className="text-xs text-text-muted">Saem no documento de cada ordem de serviço deste contrato.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="e-PAG" required>
              <Input name="ePag" value={form.ePag} onChange={handleChange} placeholder="67272.002300/2026-41" />
            </Field>
            <Field label="ETP" required>
              <Input name="etp" value={form.etp} onChange={handleChange} placeholder="79/2025" />
            </Field>
            <Field label="Termo de Referência (TR)" required>
              <Input
                name="termoReferencia"
                value={form.termoReferencia}
                onChange={handleChange}
                placeholder="26/2026"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Data-base SINAPI" required className="md:col-span-2">
              <Input
                name="dataBaseSinapi"
                value={form.dataBaseSinapi}
                onChange={handleChange}
                placeholder="Maio/2026 - Florianópolis (Não Desonerada)"
              />
            </Field>
            <Field label="BDI (%)" required>
              <Input
                name="bdi"
                inputMode="decimal"
                value={form.bdi}
                onChange={(e) => setForm((prev) => ({ ...prev, bdi: e.target.value.replace(/[^\d,]/g, "") }))}
                placeholder="21,19"
              />
            </Field>
          </div>
          <Field label="Endereço do local dos serviços" required>
            <Input
              icon={MapPin}
              name="endereco"
              value={form.endereco}
              onChange={handleChange}
              placeholder="Base Aérea de Florianópolis - Av. Santos Dumont, s/n, CEP 88049-000"
            />
          </Field>
        </FormSection>
      ),
    },
    {
      id: "lotes",
      label: "Lotes",
      icon: Layers2,
      validate: validateLotes,
      content: (
        <FormSection
          title={
            <>
              Lotes <span className="normal-case tracking-normal font-normal text-text-muted">(opcional)</span>
            </>
          }
          icon={Layers2}
        >
          <p className="text-xs text-text-muted">
            Cadastre os lotes se a licitação teve desconto por lote: toda ordem de serviço do contrato escolhe um deles.
          </p>
          {lotes.map((lote) => (
            <div key={lote.key} className="grid grid-cols-[4.5rem_1fr_6.5rem_auto] gap-2 items-center">
              <Input
                aria-label="Número do lote"
                inputMode="numeric"
                value={lote.numero}
                onChange={(e) => updateLote(lote.key, { numero: e.target.value.replace(/\D/g, "") })}
                placeholder="Nº"
              />
              <Input
                aria-label="Nome do lote"
                value={lote.nome}
                onChange={(e) => updateLote(lote.key, { nome: e.target.value })}
                placeholder="Nome (ex.: DO)"
              />
              <Input
                aria-label="Desconto do lote (%)"
                inputMode="decimal"
                suffix="%"
                value={lote.desconto}
                onChange={(e) => updateLote(lote.key, { desconto: e.target.value.replace(/[^\d,]/g, "") })}
                placeholder="24,8"
              />
              <IconButton
                icon={Trash2}
                label="Remover lote"
                variant="danger"
                onClick={() => setLotes((prev) => prev.filter((l) => l.key !== lote.key))}
              />
            </div>
          ))}
          <Button variant="secondary" size="sm" icon={Plus} onClick={addLote}>
            Adicionar lote
          </Button>
        </FormSection>
      ),
    },
    {
      id: "fiscais",
      label: "Fiscais",
      icon: ShieldCheck,
      validate: validateFiscais,
      content: (
        <FormSection title="Fiscais do contrato" icon={ShieldCheck}>
          <p className="text-xs text-text-muted">
            Cada ordem de serviço escolhe, entre estes, o fiscal técnico e o administrativo. Cadastre ao menos um de
            cada tipo para poder emitir OS.
          </p>
          {fiscais.map((fiscal) => (
            <div key={fiscal.key} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Select
                  aria-label="Tipo do fiscal"
                  value={fiscal.tipo}
                  onChange={(e) => updateFiscal(fiscal.key, { tipo: e.target.value as FiscalTipo })}
                  className="w-auto"
                >
                  {(Object.keys(FISCAL_TIPO_LABEL) as FiscalTipo[]).map((tipo) => (
                    <option key={tipo} value={tipo}>
                      Fiscal {FISCAL_TIPO_LABEL[tipo]}
                    </option>
                  ))}
                </Select>
                <IconButton
                  icon={Trash2}
                  label="Remover fiscal"
                  variant="danger"
                  onClick={() => setFiscais((prev) => prev.filter((f) => f.key !== fiscal.key))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_6rem_1fr] gap-2">
                <Input
                  aria-label="Posto e nome do fiscal"
                  value={fiscal.nome}
                  onChange={(e) => updateFiscal(fiscal.key, { nome: e.target.value })}
                  placeholder="Posto e nome (ex.: 1º SGT FLORIANO)"
                />
                <Input
                  aria-label="Ramal do fiscal"
                  value={fiscal.ramal}
                  onChange={(e) => updateFiscal(fiscal.key, { ramal: e.target.value })}
                  placeholder="Ramal"
                />
                <Input
                  aria-label="E-mail do fiscal"
                  type="email"
                  value={fiscal.email}
                  onChange={(e) => updateFiscal(fiscal.key, { email: e.target.value })}
                  placeholder="e-mail@fab.mil.br"
                />
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FISCAL_TIPO_LABEL) as FiscalTipo[]).map((tipo) => (
              <Button key={tipo} variant="secondary" size="sm" icon={Plus} onClick={() => addFiscal(tipo)}>
                Fiscal {FISCAL_TIPO_LABEL[tipo].toLowerCase()}
              </Button>
            ))}
          </div>
        </FormSection>
      ),
    },
    // Situação: só na edição
    ...(contrato
      ? [
          {
            id: "situacao",
            label: "Situação",
            icon: Activity,
            content: (
              <FormSection title="Status do Contrato" icon={Activity}>
                <SegmentedControl
                  label="Status do contrato"
                  options={STATUS_OPTIONS}
                  value={currentStatus}
                  loadingValue={updatingStatus}
                  onChange={handleStatusChange}
                />
              </FormSection>
            ),
          } satisfies FormStep,
        ]
      : []),
  ];

  return (
    <Modal open size="lg" onClose={handleClose}>
      <ModalHeader
        icon={FileSignature}
        title={contrato ? "Editar Contrato" : "Novo Contrato"}
        description={contrato ? `Editando: ${contrato.identificador}` : "Preencha os dados para cadastrar o contrato"}
        onClose={handleClose}
      />

      <StepForm
        steps={steps}
        isEdit={contrato !== null}
        isSubmitting={isLoading}
        submitLabel={contrato ? "Salvar Alterações" : "Cadastrar Contrato"}
        onCancel={handleClose}
        onSubmit={submit}
        onBlur={createBlurNormalizer(setForm, CONTRATO_FIELD_RULES)}
      />
    </Modal>
  );
}
