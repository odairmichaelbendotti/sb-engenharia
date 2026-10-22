import {
  Receipt,
  Hash,
  FileSignature,
  Tag,
  AlignLeft,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Activity,
} from "lucide-react";
import { StepForm, type FormStep } from "../../components/StepForm";
import {
  Field,
  FormSection,
  Input,
  Modal,
  ModalHeader,
  SegmentedControl,
  Select,
  Textarea,
  type SegmentOption,
} from "../../components/ui";
import { useContratos } from "../../store/contratos";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { defaultFetch } from "../../services/api";
import { useEmpenhos } from "../../store/empenhos";
import { formatCurrency } from "../../utils/format-currency";
import { maskCurrency, formatValueToCurrencyMask, parseCurrencyMask } from "../../utils/masks";
import type { EmpenhoList, EmpenhoCategory } from "../../../types/empenho";
import { createBlurNormalizer, EMPENHO_FIELD_RULES } from "../../utils/normalization/form-rules";

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

type EmpenhoStatus = "ATIVO" | "FINALIZADO" | "CANCELADO";

const STATUS_OPTIONS: SegmentOption<EmpenhoStatus>[] = [
  { value: "ATIVO", label: "Ativo", icon: Activity, tone: "warning" },
  { value: "FINALIZADO", label: "Finalizado", icon: CheckCircle2, tone: "success" },
  { value: "CANCELADO", label: "Cancelado", icon: XCircle, tone: "danger" },
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
  const [currentStatus, setCurrentStatus] = useState<EmpenhoStatus>(
    (empenho?.status as EmpenhoStatus) || "ATIVO",
  );
  const [updatingStatus, setUpdatingStatus] = useState<EmpenhoStatus | null>(null);

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
      setCurrentStatus(empenho.status as EmpenhoStatus);
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

  const numericValue = parseCurrencyMask(formState.value);

  // Validação de cada etapa: devolve a mensagem do primeiro problema ou null
  function validateIdentificacao() {
    if (!formState.numero || !formState.category || !formState.value) {
      return "Preencha o número, o valor e a categoria do empenho";
    }
    if (numericValue <= 0) return "Valor deve ser um número válido maior que zero";
    return null;
  }

  function validateContrato() {
    return formState.contrato_id ? null : "Selecione um contrato";
  }

  function validateDescricao() {
    if (!formState.description) return "Preencha a descrição do empenho";
    if (new Date(formState.startAt) > new Date(formState.endAt)) {
      return "Data de início deve ser menor que a data de término";
    }
    return null;
  }

  async function handleStatusChange(status: EmpenhoStatus) {
    if (!empenho) return;
    setUpdatingStatus(status);
    await updateStatus({ status, empenhoId: empenho.id });
    setCurrentStatus(status);
    await fetchListEmpenhos();
    setUpdatingStatus(null);
  }

  async function submit() {
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
    <Modal open size="xl" onClose={handleClose}>
      <ModalHeader
        icon={Receipt}
        title={empenho ? "Editar Empenho" : "Novo Empenho"}
        description={empenho ? "Atualize os dados do empenho" : "Preencha os dados para criar um novo empenho"}
        onClose={handleClose}
      />

      <StepForm
        isEdit={empenho !== null}
        isSubmitting={isLoading}
        submitLabel={empenho ? "Salvar Alterações" : "Criar Empenho"}
        onCancel={handleClose}
        onSubmit={submit}
        onBlur={createBlurNormalizer(setFormState, EMPENHO_FIELD_RULES)}
        steps={[
          {
            id: "identificacao",
            label: "Identificação",
            icon: Hash,
            validate: validateIdentificacao,
            content: (
              <FormSection title="Identificação" icon={Hash}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Número do Empenho" required>
                    <Input
                      icon={Hash}
                      name="numero"
                      value={formState.numero}
                      onChange={handleChange}
                      placeholder="NE2028003"
                    />
                  </Field>
                  <Field label="Valor" required>
                    <Input
                      prefix="R$"
                      inputMode="numeric"
                      name="value"
                      value={formState.value}
                      onChange={handleChange}
                      placeholder="0,00"
                    />
                  </Field>
                </div>
                <Field label="Categoria" required>
                  <Select icon={Tag} name="category" value={formState.category} onChange={handleChange}>
                    <option value="">Selecione uma categoria</option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </FormSection>
            ),
          },
          {
            id: "contrato",
            label: "Contrato",
            icon: FileSignature,
            validate: validateContrato,
            content: (
              <FormSection title="Contrato" icon={FileSignature}>
                <Field
                  label="Contrato"
                  required
                  hint={
                    selectedContrato && (
                      <>
                        Saldo disponível:{" "}
                        <span
                          className={
                            saldoDisponivelParaEmpenho <= 0
                              ? "text-danger-text font-medium"
                              : "text-success-text font-medium"
                          }
                        >
                          {formatCurrency(saldoDisponivelParaEmpenho)}
                        </span>{" "}
                        de {formatCurrency(selectedContrato.valor)}
                      </>
                    )
                  }
                >
                  <Select
                    icon={FileSignature}
                    name="contrato_id"
                    value={formState.contrato_id}
                    onChange={handleChange}
                  >
                    <option value="">Selecione um contrato</option>
                    {contratos.map((contrato) => (
                      <option key={contrato.id} value={contrato.id}>
                        {contrato.identificador} — {contrato.descricaoCurta} ({contrato.company.name})
                      </option>
                    ))}
                  </Select>
                </Field>
              </FormSection>
            ),
          },
          {
            id: "descricao",
            label: "Descrição e vigência",
            icon: AlignLeft,
            validate: validateDescricao,
            content: (
              <>
                <FormSection title="Descrição" icon={AlignLeft}>
                  <Textarea
                    name="description"
                    value={formState.description}
                    onChange={handleChange}
                    placeholder="Descreva o objeto do empenho e os serviços contratados..."
                    aria-label="Descrição"
                  />
                </FormSection>

                <FormSection title="Período de Vigência" icon={CalendarDays}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Data do Empenho">
                      <Input type="date" name="startAt" value={formState.startAt} onChange={handleChange} />
                    </Field>
                    <Field label="Data Limite">
                      <Input type="date" name="endAt" value={formState.endAt} onChange={handleChange} />
                    </Field>
                  </div>
                </FormSection>
              </>
            ),
          },
          // Situação: só na edição
          ...(empenho
            ? [
                {
                  id: "situacao",
                  label: "Situação",
                  icon: Activity,
                  content: (
                    <FormSection title="Status do Empenho" icon={Activity}>
                      <SegmentedControl
                        label="Status do empenho"
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
        ]}
      />
    </Modal>
  );
}
