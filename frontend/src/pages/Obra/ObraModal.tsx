import {
  HardHat,
  Hash,
  AlignLeft,
  MapPin,
  User,
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
import { StepForm, type FormStep } from "../../components/StepForm";
import {
  Field,
  FormSection,
  IconButton,
  Input,
  Modal,
  ModalHeader,
  SegmentedControl,
  Select,
  Textarea,
  type SegmentOption,
} from "../../components/ui";
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

const STATUS_OPTIONS: SegmentOption<ObraStatus>[] = [
  { value: "EM_ANDAMENTO", label: "Em Andamento", icon: Activity, tone: "info" },
  { value: "CONCLUIDA", label: "Concluída", icon: CheckCircle2, tone: "success" },
  { value: "PARALISADA", label: "Paralisada", icon: PauseCircle, tone: "danger" },
  { value: "CANCELADA", label: "Cancelada", icon: XCircle, tone: "neutral" },
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
  // Dados da edificação que saem na ordem de serviço
  idPatrimonialCompleto: string;
  apelido: string;
  areaConstruida: string;
  estadoConservacao: string;
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
  idPatrimonialCompleto: "",
  apelido: "",
  areaConstruida: "",
  estadoConservacao: "",
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
        idPatrimonialCompleto: obra.idPatrimonialCompleto ?? "",
        apelido: obra.apelido ?? "",
        areaConstruida: obra.areaConstruida !== null ? String(obra.areaConstruida).replace(".", ",") : "",
        estadoConservacao: obra.estadoConservacao ?? "",
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

  const latitudeNum = form.latitude.trim() ? parseFloat(form.latitude) : undefined;
  const longitudeNum = form.longitude.trim() ? parseFloat(form.longitude) : undefined;
  const areaNum = form.areaConstruida.trim() ? parseFloat(form.areaConstruida.replace(",", ".")) : undefined;

  // Validação de cada etapa: devolve a mensagem do primeiro problema ou null
  function validateIdentificacao() {
    if (!form.nome || !form.identificacaoPatrimonial || !form.responsavelTecnico) {
      return "Preencha o nome, a identificação patrimonial e o responsável técnico da obra";
    }
    return null;
  }

  function validateOrdensServico() {
    return linked.length === 0 ? "Vincule ao menos uma ordem de serviço a esta obra" : null;
  }

  function validateEdificacao() {
    if (areaNum !== undefined && (isNaN(areaNum) || areaNum < 0)) return "Área construída inválida";
    if ((latitudeNum !== undefined && isNaN(latitudeNum)) || (longitudeNum !== undefined && isNaN(longitudeNum))) {
      return "Latitude/Longitude inválidas";
    }
    return null;
  }

  async function submit() {
    const payload: CreateObraPayload = {
      nome: form.nome,
      identificacaoPatrimonial: form.identificacaoPatrimonial,
      tipo: form.tipo as CreateObraPayload["tipo"],
      descricao: form.descricao,
      latitude: latitudeNum?.toString(),
      longitude: longitudeNum?.toString(),
      responsavelTecnico: form.responsavelTecnico,
      anotacoes: form.anotacoes || undefined,
      idPatrimonialCompleto: form.idPatrimonialCompleto || undefined,
      apelido: form.apelido || undefined,
      areaConstruida: areaNum?.toString(),
      estadoConservacao: form.estadoConservacao || undefined,
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
    <Modal open size="xl" onClose={handleClose}>
      <ModalHeader
        icon={HardHat}
        title={obra ? "Editar Obra" : "Nova Obra"}
        description={obra ? `Editando: ${obra.nome}` : "Preencha os dados para cadastrar a obra"}
        onClose={handleClose}
      />

      <StepForm
        isEdit={obra !== null}
        isSubmitting={isLoading}
        submitLabel={obra ? "Salvar Alterações" : "Cadastrar Obra"}
        onCancel={handleClose}
        onSubmit={submit}
        onBlur={createBlurNormalizer(setForm, OBRA_FIELD_RULES)}
        steps={[
          {
            id: "identificacao",
            label: "Identificação",
            icon: Hash,
            validate: validateIdentificacao,
            content: (
              <FormSection title="Identificação" icon={Hash}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Nome da Obra" required>
                    <Input
                      name="nome"
                      value={form.nome}
                      onChange={handleChange}
                      placeholder="Ex.: Construção do Centro Comunitário"
                    />
                  </Field>
                  <Field label="Identificação Patrimonial" required>
                    <Input
                      icon={Hash}
                      name="identificacaoPatrimonial"
                      value={form.identificacaoPatrimonial}
                      onChange={handleChange}
                      placeholder="E-027"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Tipo de Obra" required>
                    <Select name="tipo" value={form.tipo} onChange={handleChange}>
                      {TIPOS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Responsável Técnico" required>
                    <Input
                      icon={User}
                      name="responsavelTecnico"
                      value={form.responsavelTecnico}
                      onChange={handleChange}
                      placeholder="Eng.º João Silva — CREA 12345"
                    />
                  </Field>
                </div>
              </FormSection>
            ),
          },
          {
            id: "edificacao",
            label: "Edificação e localização",
            icon: MapPin,
            validate: validateEdificacao,
            content: (
              <>
                {/* Edificação: dados que saem no documento da ordem de serviço */}
                <FormSection title="Edificação (documento da OS)" icon={FileText}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Identificação patrimonial completa">
                      <Input
                        name="idPatrimonialCompleto"
                        value={form.idPatrimonialCompleto}
                        onChange={handleChange}
                        placeholder="SC.027-67272-E-050"
                      />
                    </Field>
                    <Field label="Apelido da edificação">
                      <Input name="apelido" value={form.apelido} onChange={handleChange} placeholder="SCOAM-FL" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Área construída (m²)">
                      <Input
                        name="areaConstruida"
                        inputMode="decimal"
                        value={form.areaConstruida}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, areaConstruida: e.target.value.replace(/[^\d,]/g, "") }))
                        }
                        placeholder="60,06"
                      />
                    </Field>
                    <Field label="Estado de conservação">
                      <Input
                        name="estadoConservacao"
                        value={form.estadoConservacao}
                        onChange={handleChange}
                        placeholder="Bom"
                      />
                    </Field>
                  </div>
                </FormSection>

                {/* Localização (coordenadas do mapa — endereço vem do tenant) */}
                <FormSection title="Localização" icon={MapPin}>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Latitude">
                      <Input
                        type="number"
                        step="any"
                        name="latitude"
                        value={form.latitude}
                        onChange={handleChange}
                        placeholder="-15.7801"
                      />
                    </Field>
                    <Field label="Longitude">
                      <Input
                        type="number"
                        step="any"
                        name="longitude"
                        value={form.longitude}
                        onChange={handleChange}
                        placeholder="-47.9292"
                      />
                    </Field>
                  </div>
                </FormSection>
              </>
            ),
          },
          {
            id: "ordens-servico",
            label: "Ordens de serviço",
            icon: FileSignature,
            validate: validateOrdensServico,
            content: (
              // Ordens de serviço da obra (uma obra pode ter várias)
              <FormSection title="Ordens de Serviço" icon={FileSignature}>
                <p className="text-xs text-text-muted">
                  O cronograma e o orçamento da obra vêm das OS vinculadas. Faltou um serviço? Emita uma nova OS e
                  vincule-a aqui.
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
                              OS {os.numero}{" "}
                              <span className="text-text-muted font-normal">· {formatCurrency(os.valor)}</span>
                            </p>
                            <p className="text-xs text-text-secondary truncate">
                              {os.contrato}
                              {os.dataInicio && os.dataPrevisaoTermino
                                ? ` · ${formatDateOnly(os.dataInicio)} a ${formatDateOnly(os.dataPrevisaoTermino)}`
                                : " · sem prazo definido"}
                            </p>
                          </div>
                          <IconButton
                            icon={Trash2}
                            label={lockedReason ?? "Retirar OS da obra"}
                            variant="danger"
                            size="sm"
                            onClick={() => handleUnlinkOrdemServico(os.id)}
                            disabled={lockedReason !== null}
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}

                <Field
                  label={linked.length === 0 ? "Ordem de Serviço" : "Vincular outra ordem de serviço"}
                  required={linked.length === 0}
                  hint={
                    availableOptions.length === 0 &&
                    linked.length === 0 && (
                      <span className="text-warning-text">
                        Não há ordens de serviço disponíveis para vincular. Cadastre uma em Administrativo &gt; Ordens
                        de Serviço.
                      </span>
                    )
                  }
                >
                  <Select
                    value=""
                    onChange={(e) => handleLinkOrdemServico(e.target.value)}
                    disabled={availableOptions.length === 0}
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
                  </Select>
                </Field>
              </FormSection>
            ),
          },
          {
            id: "detalhes",
            label: "Detalhes",
            icon: AlignLeft,
            content: (
              <FormSection title="Detalhes Técnicos" icon={AlignLeft}>
                <Field label="Descrição do Objeto">
                  <Textarea
                    name="descricao"
                    value={form.descricao}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Descreva o objeto, escopo e especificações técnicas da obra..."
                  />
                </Field>
                <Field label="Anotações de Campo">
                  <Textarea
                    name="anotacoes"
                    value={form.anotacoes}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Observações, intercorrências ou notas internas..."
                  />
                </Field>
              </FormSection>
            ),
          },
          // Situação: só na edição
          ...(obra
            ? [
                {
                  id: "situacao",
                  label: "Situação",
                  icon: Activity,
                  content: (
                    <FormSection title="Status da Obra" icon={FileText}>
                      <SegmentedControl
                        label="Status da obra"
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
