import {
  ClipboardList,
  Hash,
  FileSignature,
  Layers2,
  DollarSign,
  Activity,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  CalendarDays,
  HardHat,
  Tag,
  Wrench,
  ShieldCheck,
  ListChecks,
  Paperclip,
} from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { StepForm, type FormStep } from "../../components/StepForm";
import { getFaseEmissao } from "./ordem-servico-ciencia";
import { AnexosStep } from "./AnexosStep";
import { useAnexosForm } from "./anexos-os";
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
  Textarea,
  type SegmentOption,
} from "../../components/ui";
import { useEmpenhos } from "../../store/empenhos";
import { useContratos } from "../../store/contratos";
import { useOrdensServico } from "../../store/ordensServico";
import { useObras } from "../../store/obras";
import { useMedicoes } from "../../store/medicoes";
import { maskCurrency, formatValueToCurrencyMask, parseCurrencyMask } from "../../utils/masks";
import { formatCurrency } from "../../utils/format-currency";
import { valorOrcamentoComDesconto } from "../../utils/decimal";
import type {
  OrdemServico,
  OrdemServicoStatus,
  OrdemServicoUrgencia,
  CreateOrdemServicoPayload,
} from "../../../types/ordem-servico";
import type { PlanilhaOrcamento } from "../../../types/medicao";
import { createBlurNormalizer, ORDEM_SERVICO_FIELD_RULES } from "../../utils/normalization/form-rules";
import {
  DEFAULT_PRAZO_MOBILIZACAO_DIAS,
  calcularOrcamento,
  calcularTermino,
  diaDaSemana,
  formatInputDate,
  prazoEntreDatas,
  todayInput,
} from "./ordem-servico-form-utils";

interface OrdemServicoModalProps {
  ordemServico: OrdemServico | null;
  handleClose: () => void;
  // OS nova já no contrato escolhido (ação "Nova OS neste contrato" da lista de contratos)
  initialContratoId?: string | null;
}

const STATUS_OPTIONS: SegmentOption<OrdemServicoStatus>[] = [
  { value: "ATIVO", label: "Ativa", icon: Activity, tone: "neutral" },
  { value: "FINALIZADO", label: "Finalizada", icon: CheckCircle2, tone: "neutral" },
  { value: "CANCELADO", label: "Cancelada", icon: XCircle, tone: "neutral" },
];

const URGENCIA_OPTIONS: { value: OrdemServicoUrgencia; label: string; hint: string }[] = [
  { value: "EMERGENCIA", label: "Emergência", hint: "Imediato – 24-48h" },
  { value: "URGENCIA", label: "Urgência", hint: "1-2 semanas" },
  { value: "PROGRAMADA", label: "Programada", hint: "1-3 meses" },
  { value: "PREVENTIVA", label: "Preventiva", hint: "Conforme disp. técnica e orçamentária" },
];

type FormState = {
  numero: string;
  dataInicio: string;
  prazoDias: string;
  prazoMobilizacaoDias: string;
  obra_id: string;
  lote_id: string;
  setorRequisitante: string;
  urgencia: OrdemServicoUrgencia | "";
  dataVistoria: string;
  descricaoProblema: string;
  dataEmissao: string;
  totalComBdi: string;
  fiscalSetorial: string;
  fiscalTecnico_id: string;
  fiscalAdministrativo_id: string;
};

// Datas sem horário chegam como meia-noite UTC: o dia é o prefixo ISO
function toDateInput(date: string | null | undefined) {
  return date ? date.slice(0, 10) : "";
}

// OS antiga não tem prazo em dias: deduz das datas de início e término
function initialPrazoDias(os: OrdemServico | null) {
  if (!os) return "";
  if (os.prazoDias) return String(os.prazoDias);
  if (os.dataInicio && os.dataPrevisaoTermino) {
    const dias = prazoEntreDatas(toDateInput(os.dataInicio), toDateInput(os.dataPrevisaoTermino));
    return dias > 0 ? String(dias) : "";
  }
  return "";
}

// Uma linha da lista de empenhos: qual empenho e quanto dele vai para a OS
type VinculoForm = {
  key: number;
  empenho_id: string;
  valor: string;
};

type CondicaoForm = { key: number; texto: string };

export function OrdemServicoModal({ ordemServico, handleClose, initialContratoId = null }: OrdemServicoModalProps) {
  const {
    createOrdemServico,
    updateOrdemServico,
    updateOrdemServicoStatus,
    fetchOrdensServico,
    fetchProximoNumero,
  } = useOrdensServico();
  const { data: empenhosData, fetchListEmpenhos } = useEmpenhos();
  const { data: contratosData, fetchContratos } = useContratos();
  const { obraOptions, fetchObraOptions } = useObras();
  const fetchPlanilha = useMedicoes((s) => s.fetchPlanilha);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<OrdemServicoStatus | null>(null);
  const [currentStatus, setCurrentStatus] = useState<OrdemServicoStatus>(ordemServico?.status ?? "ATIVO");
  const [form, setForm] = useState<FormState>({
    numero: ordemServico?.numero ?? "",
    dataInicio: toDateInput(ordemServico?.dataInicio),
    prazoDias: initialPrazoDias(ordemServico),
    prazoMobilizacaoDias: String(ordemServico?.prazoMobilizacaoDias ?? DEFAULT_PRAZO_MOBILIZACAO_DIAS),
    obra_id: ordemServico?.obra_id ?? "",
    lote_id: ordemServico?.lote_id ?? "",
    setorRequisitante: ordemServico?.setorRequisitante ?? "",
    urgencia: ordemServico?.urgencia ?? "",
    dataVistoria: toDateInput(ordemServico?.dataVistoria),
    descricaoProblema: ordemServico?.descricaoProblema ?? "",
    // OS nova já vem com a data de hoje; OS antiga sem data de emissão continua sem
    dataEmissao: ordemServico ? toDateInput(ordemServico.dataEmissao) : todayInput(),
    totalComBdi:
      ordemServico?.totalComBdi != null ? formatValueToCurrencyMask(ordemServico.totalComBdi) : "",
    fiscalSetorial: ordemServico?.fiscalSetorial ?? "",
    fiscalTecnico_id: ordemServico?.fiscalTecnico_id ?? "",
    fiscalAdministrativo_id: ordemServico?.fiscalAdministrativo_id ?? "",
  });
  const [selectedContratoId, setSelectedContratoId] = useState(ordemServico?.empenho.contrato.id ?? initialContratoId ?? "");
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
  const [condicoes, setCondicoes] = useState<CondicaoForm[]>(() =>
    (ordemServico?.condicoesEspeciais ?? []).map((texto) => ({ key: nextKey.current++, texto })),
  );
  const anexosForm = useAnexosForm(ordemServico?.anexos, ordemServico?.comentariosTecnicos);

  // Lista de empenhos sempre atualizada ao abrir: é dela que vêm os saldos livres
  useEffect(() => {
    fetchListEmpenhos().catch(() => toast.error("Erro ao carregar os empenhos"));
  }, [fetchListEmpenhos]);

  // Contratos atualizados: deles vêm o BDI, os lotes e os fiscais da OS
  useEffect(() => {
    fetchContratos().catch(() => toast.error("Erro ao carregar os contratos"));
  }, [fetchContratos]);

  useEffect(() => {
    fetchObraOptions().catch(() => toast.error("Erro ao carregar as obras"));
  }, [fetchObraOptions]);

  // Orçamento da OS em edição: com itens, a soma deles é o valor da OS e os empenhos precisam
  // somar ele. undefined = carregando; null = sem orçamento
  const [planilha, setPlanilha] = useState<PlanilhaOrcamento | null | undefined>(ordemServico ? undefined : null);
  useEffect(() => {
    if (!ordemServico) return;
    let cancelled = false;
    fetchPlanilha(ordemServico.id)
      .then((p) => {
        if (!cancelled) setPlanilha(p.itens.length > 0 ? p : null);
      })
      .catch(() => {
        if (!cancelled) setPlanilha(null);
      });
    return () => {
      cancelled = true;
    };
  }, [ordemServico, fetchPlanilha]);

  // Obra só depois do empenho: primeiro as obras com OS do(s) empenho(s) escolhido(s), depois
  // as demais do mesmo contrato (ex.: serviço que faltou numa obra, pago por um empenho novo).
  // Obras canceladas não recebem OS nova, mas a obra atual da OS continua na lista.
  const empenhosEscolhidos = vinculos.map((v) => v.empenho_id).filter(Boolean);
  const obrasAtivas = obraOptions.filter((o) => o.status !== "CANCELADA" || o.id === ordemServico?.obra_id);
  const obrasDoEmpenho = obrasAtivas.filter((o) => o.empenhoIds.some((id) => empenhosEscolhidos.includes(id)));
  const obrasDoContrato = obrasAtivas.filter(
    (o) => !obrasDoEmpenho.includes(o) && o.contratoIds.includes(selectedContratoId),
  );
  // Trocar contrato/empenho pode tirar a obra escolhida da lista: aí ela deixa de valer
  const obraId =
    empenhosEscolhidos.length > 0 && [...obrasDoEmpenho, ...obrasDoContrato].some((o) => o.id === form.obra_id)
      ? form.obra_id
      : "";
  const empenhos = useMemo(() => empenhosData?.empenhos ?? [], [empenhosData]);

  // Contratos que têm empenho — todos os empenhos da OS precisam ser do mesmo contrato
  const contratos = useMemo(() => {
    const byId = new Map<string, { id: string; identificador: string; descricaoCurta: string }>();
    for (const empenho of empenhos) byId.set(empenho.contrato.id, empenho.contrato);
    return [...byId.values()].sort((a, b) => a.identificador.localeCompare(b.identificador));
  }, [empenhos]);

  // Dados do contrato escolhido: lotes (com desconto), fiscais e BDI
  const contratoDados = contratosData?.contratos.find((c) => c.id === selectedContratoId);
  const lotes = contratoDados?.lotes ?? [];
  const lote = lotes.find((l) => l.id === form.lote_id);
  // OS antiga que recebe o lote agora: o orçamento lançado só com BDI passa a ter o desconto dele
  // (o backend refaz os preços ao salvar), salvo com medição fechada, que trava os preços
  const descontoNovo =
    ordemServico !== null &&
    !ordemServico.lote_id &&
    lote !== undefined &&
    planilha?.precoBase === "COM_BDI" &&
    lote.desconto !== planilha.desconto;
  const loteTravadoPorMedicao = descontoNovo && Boolean(planilha?.medicoes.some((m) => m.status === "FECHADA"));
  const valorOrcamento =
    planilha === undefined || planilha === null
      ? planilha
      : descontoNovo && !loteTravadoPorMedicao && lote
        ? valorOrcamentoComDesconto(planilha.itens, lote.desconto, planilha.regraDesconto)
        : planilha.totais.valorOrcado;
  const fiscaisTecnicos = (contratoDados?.fiscais ?? []).filter((f) => f.tipo === "TECNICO");
  const fiscaisAdministrativos = (contratoDados?.fiscais ?? []).filter((f) => f.tipo === "ADMINISTRATIVO");

  // Número da OS nova: fica oculto até o contrato (e o lote, se o contrato tiver) serem escolhidos.
  // É o próximo da sequência; o número definitivo sai na criação
  const anoEmissao = form.dataEmissao ? Number(form.dataEmissao.slice(0, 4)) : new Date().getFullYear();
  const numeroKey =
    !ordemServico && contratoDados && (lotes.length === 0 || form.lote_id)
      ? `${selectedContratoId}|${form.lote_id}|${anoEmissao}`
      : null;
  const [numeroPrevisto, setNumeroPrevisto] = useState<{ key: string; numero: string } | null>(null);
  useEffect(() => {
    if (!numeroKey) return;
    let cancelled = false;
    fetchProximoNumero(form.lote_id, anoEmissao)
      .then((numero) => {
        if (!cancelled) setNumeroPrevisto({ key: numeroKey, numero });
      })
      .catch(() => {
        if (!cancelled) setNumeroPrevisto(null);
      });
    return () => {
      cancelled = true;
    };
  }, [numeroKey, form.lote_id, anoEmissao, fetchProximoNumero]);
  const numeroRevelado = numeroKey !== null && numeroPrevisto?.key === numeroKey ? numeroPrevisto.numero : null;
  // Na edição o número já existe e aparece desde o começo
  const mostrarNumero = ordemServico !== null || numeroRevelado !== null;

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

  // O valor da OS sai do orçamento (lançado depois, em Medições). Só a OS antiga sem orçamento
  // ainda tem o total com BDI digitado e o valor informado em cada empenho
  const temOrcamento = valorOrcamento !== undefined && valorOrcamento !== null;
  // Orçamento do contrato inteiro: o valor da OS é o empenhado, informado em cada empenho, e pode
  // ficar abaixo do orçamento até chegarem os próximos empenhos
  const doContrato = temOrcamento && planilha?.escopoOrcamento === "CONTRATO";
  const valorPeloOrcamento = ordemServico === null || ordemServico.aguardandoEmissao || temOrcamento;
  // Com orçamento e vários empenhos, o usuário reparte o valor entre eles (no do contrato, sempre)
  const valorPorEmpenho = !valorPeloOrcamento || (temOrcamento && (vinculos.length > 1 || doContrato));

  // OS antiga: o usuário informa o total com BDI; o valor final aplica o desconto do lote
  const totalComBdi = parseCurrencyMask(form.totalComBdi);
  const orcamento =
    contratoDados && totalComBdi > 0 ? calcularOrcamento(totalComBdi, contratoDados.bdi, lote?.desconto ?? 0) : null;
  const valorDifere = orcamento !== null && Math.abs(orcamento.valorFinal - valorTotal) >= 0.005;

  // Prazo: o término sai do início e do prazo em dias
  const prazoDiasNum = parseInt(form.prazoDias, 10);
  const termino =
    form.dataInicio && prazoDiasNum >= 1 ? calcularTermino(form.dataInicio, prazoDiasNum) : null;

  // Com um único empenho, o valor dele acompanha o valor final calculado (ainda dá para ajustar)
  function syncValorUnico(valorFinal: number | null) {
    if (valorFinal === null || valorFinal <= 0) return;
    setVinculos((prev) =>
      prev.length === 1 ? [{ ...prev[0]!, valor: formatValueToCurrencyMask(valorFinal) }] : prev,
    );
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleTotalChange(value: string) {
    const masked = maskCurrency(value);
    setForm((prev) => ({ ...prev, totalComBdi: masked }));
    const novoTotal = parseCurrencyMask(masked);
    if (contratoDados && novoTotal > 0) {
      syncValorUnico(calcularOrcamento(novoTotal, contratoDados.bdi, lote?.desconto ?? 0).valorFinal);
    }
  }

  // O lote só é escolhido na OS nova (depois ele não muda), que ainda não tem valor
  function handleLoteChange(loteId: string) {
    setForm((prev) => ({ ...prev, lote_id: loteId }));
  }

  function handleContratoChange(contratoId: string) {
    setSelectedContratoId(contratoId);
    // Trocar de contrato zera o que depende dele: empenhos (precisam ser do mesmo contrato), lote e fiscais
    setVinculos([{ key: nextKey.current++, empenho_id: "", valor: "" }]);
    setForm((prev) => ({ ...prev, lote_id: "", fiscalTecnico_id: "", fiscalAdministrativo_id: "" }));
  }

  function handleEmpenhoChange(key: number, empenhoId: string) {
    // OS antiga: por padrão o empenho vai inteiro; com o total informado e um só empenho, vai o valor
    // final calculado. Com orçamento, um empenho só leva o valor dele; os demais começam zerados
    const valorPadrao = valorPeloOrcamento
      ? vinculos.length === 1 && temOrcamento && !doContrato
        ? valorOrcamento
        : 0
      : vinculos.length === 1 && orcamento !== null
        ? orcamento.valorFinal
        : empenhoId
          ? saldoLivre(empenhoId)
          : 0;
    setVinculos((prev) =>
      prev.map((v) =>
        v.key === key
          ? { ...v, empenho_id: empenhoId, valor: empenhoId ? formatValueToCurrencyMask(valorPadrao) : "" }
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

  const isCreate = ordemServico === null;
  // OS com número gerado pelo sistema não tem o número editado; as antigas ainda podem corrigi-lo
  const numeroFixo = ordemServico !== null && ordemServico.sequencia !== null;
  const mobilizacaoNum = parseInt(form.prazoMobilizacaoDias, 10);
  const empenhosPreenchidos = vinculos.filter((v) => v.empenho_id);

  // Validação de cada etapa (os campos do documento só são obrigatórios no cadastro: as OS
  // antigas ainda não os têm)
  function validateContrato() {
    if (!isCreate && ordemServico.sequencia === null && !form.numero) return "Preencha o número da ordem de serviço";
    if (!selectedContratoId) return "Selecione o contrato da ordem de serviço";
    if (lotes.length > 0 && isCreate && !form.lote_id) return "Selecione o lote da ordem de serviço";
    if (loteTravadoPorMedicao) {
      return "Esta OS já tem medição fechada com os preços sem desconto: exclua as medições fechadas antes de definir o lote";
    }
    return null;
  }

  // Quanto cada empenho destina à OS: o informado na OS antiga e na repartição; com um empenho só,
  // o valor do orçamento; sem orçamento ainda, zero
  function valorDoVinculo(v: VinculoForm) {
    if (valorPorEmpenho) return parseCurrencyMask(v.valor);
    return temOrcamento ? valorOrcamento : 0;
  }

  function validateEmpenhos() {
    if (empenhosPreenchidos.length === 0) return "Vincule pelo menos um empenho à ordem de serviço";
    for (const v of empenhosPreenchidos) {
      const valor = valorDoVinculo(v);
      const numero = empenhos.find((e) => e.id === v.empenho_id)?.numero ?? "";
      if (!valorPeloOrcamento && valor <= 0) return `Informe o valor destinado do empenho ${numero}`;
      if (Math.round(valor * 100) > Math.round(saldoLivre(v.empenho_id) * 100)) {
        return `O valor do empenho ${numero} excede o saldo livre dele (${formatCurrency(saldoLivre(v.empenho_id))})`;
      }
    }
    if (temOrcamento) {
      const soma = empenhosPreenchidos.reduce((acc, v) => acc + valorDoVinculo(v), 0);
      if (doContrato) {
        if (Math.round(soma * 100) > Math.round(valorOrcamento * 100)) {
          return `Os empenhos somam ${formatCurrency(soma)}; passam do orçamento do contrato (${formatCurrency(valorOrcamento)})`;
        }
      } else if (Math.round(soma * 100) !== Math.round(valorOrcamento * 100)) {
        return `Os empenhos somam ${formatCurrency(soma)}; precisam somar o valor do orçamento (${formatCurrency(valorOrcamento)})`;
      }
    }
    return null;
  }

  function validateServico() {
    if (!isCreate) return null;
    if (!form.setorRequisitante) return "Informe o setor requisitante da ordem de serviço";
    if (!form.dataVistoria) return "Informe a data da vistoria da ordem de serviço";
    if (!form.urgencia) return "Informe a classificação de urgência da ordem de serviço";
    if (!form.descricaoProblema.trim()) return "Informe a descrição do problema da ordem de serviço";
    return null;
  }

  function validatePrazo() {
    if (!form.dataInicio || !termino) return "Informe o início e o prazo em dias da ordem de serviço";
    if (isNaN(mobilizacaoNum) || mobilizacaoNum < 0 || mobilizacaoNum > prazoDiasNum) {
      return "O prazo de mobilização deve ser de 0 até o prazo total da OS";
    }
    return null;
  }

  function validateFiscais() {
    if (!isCreate) return null;
    if (!form.fiscalTecnico_id) return "Informe o fiscal técnico da ordem de serviço";
    if (!form.fiscalAdministrativo_id) return "Informe o fiscal administrativo da ordem de serviço";
    if (!form.fiscalSetorial.trim()) return "Informe o fiscal setorial da ordem de serviço";
    return null;
  }

  async function submit() {
    if (!termino) return;
    const payload: CreateOrdemServicoPayload = {
      ...(isCreate ? {} : { numero: form.numero }),
      empenhos: empenhosPreenchidos.map((v) => ({ empenho_id: v.empenho_id, valor: valorDoVinculo(v) })),
      dataInicio: form.dataInicio,
      dataPrevisaoTermino: termino,
      obra_id: obraId || null,
      lote_id: form.lote_id || null,
      setorRequisitante: form.setorRequisitante,
      urgencia: form.urgencia || null,
      dataVistoria: form.dataVistoria || null,
      descricaoProblema: form.descricaoProblema,
      dataEmissao: form.dataEmissao,
      prazoMobilizacaoDias: mobilizacaoNum,
      prazoDias: prazoDiasNum,
      // Com orçamento o total com BDI sai dos itens; o backend ignora o enviado
      totalComBdi: !valorPeloOrcamento && totalComBdi > 0 ? totalComBdi : null,
      fiscalSetorial: form.fiscalSetorial,
      fiscalTecnico_id: form.fiscalTecnico_id || null,
      fiscalAdministrativo_id: form.fiscalAdministrativo_id || null,
      condicoesEspeciais: condicoes.map((c) => c.texto.trim()).filter(Boolean),
      ...anexosForm.toPayload(),
    };

    try {
      setIsLoading(true);
      if (ordemServico) {
        const updated = await updateOrdemServico(ordemServico.id, payload);
        // Emissão nova = o backend reemitiu a OS (o conteúdo mudou) e a ciência recomeçou
        const reemitida = updated.emitidaEm !== null && updated.emitidaEm !== ordemServico.emitidaEm;
        toast.success(
          reemitida
            ? `Ordem de serviço "${ordemServico.numero}" atualizada e reemitida: a empresa precisa dar ciência de novo.`
            : `Ordem de serviço "${ordemServico.numero}" atualizada com sucesso!`,
        );
      } else {
        const created = await createOrdemServico(payload);
        toast.success(
          `Ordem de serviço "${created.numero}" criada. Lance o orçamento em Medições e emita a OS para a empresa.`,
        );
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

  const steps: FormStep[] = [
    {
      id: "contrato",
      label: "Contrato",
      icon: FileSignature,
      validate: validateContrato,
      content: (
        <>
          {/* Identificação: o número só aparece depois de escolher o contrato e o lote */}
          <FormSection title="Identificação" icon={Hash}>
            <div
              className={`grid transition-[grid-template-columns] duration-500 ease-out ${
                mostrarNumero ? "grid-cols-[1fr_1fr]" : "grid-cols-[0fr_1fr]"
              }`}
            >
              <div className="overflow-hidden min-w-0" aria-hidden={!mostrarNumero}>
                <div
                  className={`pr-4 transition-opacity duration-500 ${mostrarNumero ? "opacity-100" : "opacity-0"}`}
                >
                  <Field label="Número" required={!isCreate && !numeroFixo}>
                    {!isCreate && !numeroFixo ? (
                      <Input
                        icon={Hash}
                        name="numero"
                        value={form.numero}
                        onChange={handleChange}
                        placeholder="04/01/BAFL/2026"
                      />
                    ) : (
                      <p className="min-h-10 flex items-center px-3 py-2 rounded-lg border border-border bg-surface-muted text-sm font-semibold text-text-primary wrap-break-word">
                        {ordemServico?.numero ?? numeroRevelado}
                      </p>
                    )}
                  </Field>
                </div>
              </div>
              <Field label="Data de emissão">
                <Input type="date" name="dataEmissao" value={form.dataEmissao} onChange={handleChange} />
              </Field>
            </div>
            {isCreate && !mostrarNumero && (
              <p className="text-xs text-text-muted">
                O número da OS aparece aqui quando você escolher o contrato{lotes.length > 0 ? " e o lote" : ""}.
              </p>
            )}
          </FormSection>

          <FormSection title="Contrato" icon={FileSignature}>
            {contratoFixo ? (
              <div className="bg-surface-muted rounded-lg p-4 border border-border flex items-center gap-3">
                <div className="w-10 h-10 bg-surface border border-border rounded-lg flex items-center justify-center shrink-0">
                  <FileSignature size={18} className="text-text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {contratoFixo.identificador} — {contratoFixo.descricaoCurta}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {contratoFixo.company.name} · o contrato da OS não muda; os empenhos são dele
                  </p>
                </div>
              </div>
            ) : (
              <Field label="Contrato" required>
                <Select
                  icon={FileSignature}
                  value={selectedContratoId}
                  onChange={(e) => handleContratoChange(e.target.value)}
                >
                  <option value="">Selecione um contrato</option>
                  {contratos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.identificador} — {c.descricaoCurta}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            {lotes.length > 0 && (
              <Field
                label="Lote"
                required={!ordemServico}
                hint={
                  ordemServico?.lote_id
                    ? "O lote de uma OS já emitida não muda."
                    : descontoNovo && !loteTravadoPorMedicao && planilha
                      ? `Os preços do orçamento recebem o desconto do lote: o valor da OS passa de ${formatCurrency(planilha.totais.valorOrcado)} para ${formatCurrency(valorOrcamento ?? 0)}.`
                      : "O desconto do lote entra no cálculo do valor da OS."
                }
              >
                <Select
                  icon={Tag}
                  value={form.lote_id}
                  onChange={(e) => handleLoteChange(e.target.value)}
                  disabled={Boolean(ordemServico?.lote_id)}
                >
                  <option value="">Selecione o lote</option>
                  {lotes.map((l) => (
                    <option key={l.id} value={l.id}>
                      Lote {String(l.numero).padStart(2, "0")} – {l.nome} (desconto de {String(l.desconto).replace(".", ",")}%)
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </FormSection>
        </>
      ),
    },
    {
      id: "empenhos",
      label: "Empenhos e obra",
      icon: Layers2,
      validate: validateEmpenhos,
      content: (
        <>
          <FormSection title="Empenhos" icon={Layers2}>
            <p className="text-xs text-text-muted">
              {!valorPeloOrcamento
                ? "Ao escolher o empenho, o valor já vem com todo o saldo livre dele (ou com o valor final calculado, se o total com BDI já foi informado). Diminua só se o empenho for dividido entre várias ordens de serviço."
                : temOrcamento
                  ? doContrato
                    ? `Orçamento do contrato (${formatCurrency(valorOrcamento)}): informe quanto de cada empenho vai para esta OS. O valor da OS é o empenhado e pode ficar abaixo do orçamento.`
                    : vinculos.length > 1
                    ? `Reparta o valor do orçamento (${formatCurrency(valorOrcamento)}) entre os empenhos.`
                    : `O empenho leva o valor do orçamento (${formatCurrency(valorOrcamento)}).`
                  : "O valor da OS sai do orçamento: depois de criar, lance o orçamento em Medições e emita a OS para a empresa. Com mais de um empenho, a repartição é feita no orçamento."}
            </p>

            {vinculos.map((vinculo) => {
              const disponiveis = empenhosDoContrato.filter(
                (e) => e.id === vinculo.empenho_id || !vinculos.some((v) => v.empenho_id === e.id),
              );
              const empenho = empenhos.find((e) => e.id === vinculo.empenho_id);
              return (
                <div key={vinculo.key} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select
                      aria-label="Empenho"
                      value={vinculo.empenho_id}
                      onChange={(e) => handleEmpenhoChange(vinculo.key, e.target.value)}
                      disabled={!selectedContratoId}
                      className="flex-1 min-w-0"
                    >
                      <option value="">
                        {selectedContratoId ? "Selecione um empenho" : "Selecione um contrato primeiro"}
                      </option>
                      {disponiveis.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.numero} — {e.description}
                        </option>
                      ))}
                    </Select>
                    <div className="flex gap-2">
                      {valorPorEmpenho && (
                        <Input
                          prefix="R$"
                          inputMode="numeric"
                          aria-label="Valor destinado à OS"
                          value={vinculo.valor}
                          onChange={(e) => handleValorChange(vinculo.key, e.target.value)}
                          placeholder="0,00"
                          className="sm:w-44 flex-1"
                        />
                      )}
                      <IconButton
                        icon={Trash2}
                        label="Remover empenho da OS"
                        variant="danger"
                        onClick={() => removeVinculo(vinculo.key)}
                        disabled={vinculos.length === 1}
                      />
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

            <Button
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={addVinculo}
              disabled={!selectedContratoId || vinculos.length >= empenhosDoContrato.length}
            >
              Adicionar outro empenho
            </Button>
          </FormSection>

          {/* Obra: só depois do empenho, para listar apenas as obras dele e do mesmo contrato */}
          <FormSection title="Obra" icon={HardHat}>
            <Field
              hint={
                empenhosEscolhidos.length === 0
                  ? "Escolha o empenho acima para ver as obras disponíveis."
                  : "Uma obra pode ter várias OS (ex.: um serviço que faltou vira uma nova OS na mesma obra)."
              }
            >
              <Select
                icon={HardHat}
                aria-label="Obra"
                name="obra_id"
                value={obraId}
                onChange={handleChange}
                disabled={empenhosEscolhidos.length === 0}
              >
                <option value="">
                  {empenhosEscolhidos.length === 0 ? "Selecione um empenho primeiro" : "Sem obra por enquanto"}
                </option>
                {obrasDoEmpenho.length > 0 && (
                  <optgroup label="Obras deste empenho">
                    {obrasDoEmpenho.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.identificacaoPatrimonial} — {o.nome}
                      </option>
                    ))}
                  </optgroup>
                )}
                {obrasDoContrato.length > 0 && (
                  <optgroup label="Outras obras do mesmo contrato">
                    {obrasDoContrato.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.identificacaoPatrimonial} — {o.nome}
                      </option>
                    ))}
                  </optgroup>
                )}
              </Select>
            </Field>
          </FormSection>
        </>
      ),
    },
    {
      id: "servico",
      label: "Serviço",
      icon: Wrench,
      validate: validateServico,
      content: (
        <FormSection title="Serviço" icon={Wrench}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Setor requisitante" required={!ordemServico}>
              <Input
                name="setorRequisitante"
                value={form.setorRequisitante}
                onChange={handleChange}
                placeholder="SCOAM-FL"
              />
            </Field>
            <Field label="Data da vistoria" required={!ordemServico}>
              <Input type="date" name="dataVistoria" value={form.dataVistoria} onChange={handleChange} />
            </Field>
          </div>
          <Field label="Classificação de urgência" required={!ordemServico} group>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {URGENCIA_OPTIONS.map((option) => {
                const selected = form.urgencia === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setForm((prev) => ({ ...prev, urgencia: option.value }))}
                    className={`text-left px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                      selected
                        ? "bg-surface-muted border-primary-500 ring-1 ring-primary-500 text-text-primary"
                        : "bg-surface border-border text-text-secondary hover:border-border-strong"
                    }`}
                  >
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className="block text-xs text-text-muted">{option.hint}</span>
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Descrição do problema" required={!ordemServico}>
            <Textarea
              name="descricaoProblema"
              value={form.descricaoProblema}
              onChange={handleChange}
              rows={4}
              placeholder="Descreva o problema encontrado na vistoria e o serviço necessário"
            />
          </Field>
        </FormSection>
      ),
    },
    {
      id: "prazo",
      label: "Prazo",
      icon: CalendarDays,
      validate: validatePrazo,
      content: (
        <FormSection title="Cronograma" icon={CalendarDays}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Início" required>
              <Input type="date" name="dataInicio" value={form.dataInicio} onChange={handleChange} />
            </Field>
            <Field label="Prazo (dias corridos)" required>
              <Input
                name="prazoDias"
                inputMode="numeric"
                value={form.prazoDias}
                onChange={(e) => setForm((prev) => ({ ...prev, prazoDias: e.target.value.replace(/\D/g, "") }))}
                placeholder="49"
              />
            </Field>
            <Field label="Mobilização (dias)">
              <Input
                name="prazoMobilizacaoDias"
                inputMode="numeric"
                value={form.prazoMobilizacaoDias}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, prazoMobilizacaoDias: e.target.value.replace(/\D/g, "") }))
                }
                placeholder={String(DEFAULT_PRAZO_MOBILIZACAO_DIAS)}
              />
            </Field>
          </div>
          <div className="bg-surface-muted rounded-lg p-4 border border-border grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-text-muted">Início</p>
              <p className="text-sm font-semibold text-text-primary">
                {form.dataInicio ? (
                  <>
                    {formatInputDate(form.dataInicio)}{" "}
                    <span className="font-normal text-text-secondary">· {diaDaSemana(form.dataInicio)}</span>
                  </>
                ) : (
                  "—"
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Término previsto</p>
              <p className="text-sm font-semibold text-text-primary">
                {termino ? (
                  <>
                    {formatInputDate(termino)}{" "}
                    <span className="font-normal text-text-secondary">· {diaDaSemana(termino)}</span>
                  </>
                ) : (
                  "—"
                )}
              </p>
            </div>
            <p className="sm:col-span-2 text-xs text-text-muted">
              O dia do início conta como o primeiro dia do prazo. A mobilização já está incluída no prazo total.
            </p>
          </div>
        </FormSection>
      ),
    },
    // Com orçamento, só o resumo; OS antiga sem orçamento ainda informa o total com BDI; OS nova não tem etapa
    ...(temOrcamento
      ? [
    {
      id: "valor",
      label: "Valor",
      icon: DollarSign,
      content: (
        <FormSection title="Financeiro" icon={DollarSign}>
          <p className="text-xs text-text-muted">
            {doContrato
              ? "O orçamento é o do contrato inteiro; o valor da OS é o empenhado (soma dos empenhos). Para mudar o orçamento, edite-o em Medições."
              : "O valor da OS é a soma dos itens do orçamento, já com o desconto. Para mudá-lo, edite o orçamento em Medições."}
          </p>
          <div className="bg-surface-muted rounded-lg p-3 border border-border grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-text-muted">Total com BDI</p>
              <p className="text-sm font-semibold text-text-primary tabular-nums">
                {ordemServico?.totalComBdi != null ? formatCurrency(ordemServico.totalComBdi) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Desconto da OS</p>
              <p className="text-sm font-semibold text-text-primary tabular-nums">
                {String(descontoNovo && lote ? lote.desconto : (ordemServico?.desconto ?? 0)).replace(".", ",")}%
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">
                {doContrato ? "Orçamento do contrato · empenhado" : "Valor da Ordem de Serviço"}
              </p>
              <p className="text-sm font-semibold text-text-primary tabular-nums">
                {doContrato
                  ? `${formatCurrency(valorOrcamento ?? 0)} · ${formatCurrency(valorTotal)}`
                  : formatCurrency(valorOrcamento ?? 0)}
              </p>
            </div>
          </div>
        </FormSection>
      ),
    },
        ]
      : valorPeloOrcamento
        ? []
        : [
    {
      id: "valor",
      label: "Valor",
      icon: DollarSign,
      content: (
        <FormSection title="Financeiro" icon={DollarSign}>
          <Field
            label="Total com BDI (R$)"
            hint={
              contratoDados
                ? `O total sem BDI e o valor final saem dele (BDI de ${String(contratoDados.bdi).replace(".", ",")}%${lote ? ` e desconto de ${String(lote.desconto).replace(".", ",")}%` : ""}).`
                : "Escolha o contrato para calcular o total sem BDI e o valor final."
            }
          >
            <Input
              prefix="R$"
              name="totalComBdi"
              inputMode="numeric"
              value={form.totalComBdi}
              onChange={(e) => handleTotalChange(e.target.value)}
              placeholder="0,00"
              className="sm:w-64"
            />
          </Field>
          {orcamento && (
            <div className="bg-surface-muted rounded-lg p-3 border border-border grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-text-muted">Total (sem BDI)</p>
                <p className="text-sm font-semibold text-text-primary tabular-nums">{formatCurrency(orcamento.totalSemBdi)}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Valor final calculado (com BDI e desconto)</p>
                <p className="text-sm font-semibold text-text-primary tabular-nums">{formatCurrency(orcamento.valorFinal)}</p>
              </div>
            </div>
          )}
          <div className="bg-surface-muted rounded-lg p-4 border border-border flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-text-muted">Valor da Ordem de Serviço</p>
              <p className="text-xs text-text-secondary">Soma dos valores destinados pelos empenhos</p>
            </div>
            <p className="text-lg font-semibold text-text-primary tabular-nums">{formatCurrency(valorTotal)}</p>
          </div>
          {valorDifere && orcamento && (
            <p className="text-xs text-warning-text">
              A soma dos empenhos ({formatCurrency(valorTotal)}) é diferente do valor final calculado (
              {formatCurrency(orcamento.valorFinal)}). Ajuste o valor do empenho se o valor oficial da OS for outro.
            </p>
          )}
        </FormSection>
      ),
    },
          ]),
    {
      id: "fiscais",
      label: "Fiscais e condições",
      icon: ShieldCheck,
      validate: validateFiscais,
      content: (
        <>
          <FormSection title="Fiscais" icon={ShieldCheck}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Fiscal técnico" required={!ordemServico}>
                <Select
                  name="fiscalTecnico_id"
                  value={form.fiscalTecnico_id}
                  onChange={handleChange}
                  disabled={!selectedContratoId}
                >
                  <option value="">{selectedContratoId ? "Selecione o fiscal técnico" : "Selecione um contrato primeiro"}</option>
                  {fiscaisTecnicos.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome} – {f.ramal}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Fiscal administrativo" required={!ordemServico}>
                <Select
                  name="fiscalAdministrativo_id"
                  value={form.fiscalAdministrativo_id}
                  onChange={handleChange}
                  disabled={!selectedContratoId}
                >
                  <option value="">
                    {selectedContratoId ? "Selecione o fiscal administrativo" : "Selecione um contrato primeiro"}
                  </option>
                  {fiscaisAdministrativos.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome} – {f.ramal}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            {selectedContratoId && contratoDados && (fiscaisTecnicos.length === 0 || fiscaisAdministrativos.length === 0) && (
              <p className="text-xs text-warning-text">
                Este contrato não tem fiscal {fiscaisTecnicos.length === 0 ? "técnico" : "administrativo"} cadastrado:
                cadastre em Administrativo &gt; Contratos.
              </p>
            )}
            <Field label="Fiscal setorial" required={!ordemServico}>
              <Input
                name="fiscalSetorial"
                value={form.fiscalSetorial}
                onChange={handleChange}
                placeholder="SO RAPHAEL C. – 5012 / raphaelrcc@fab.mil.br"
              />
            </Field>
          </FormSection>

          <FormSection title="Condições especiais desta OS" icon={ListChecks}>
            <p className="text-xs text-text-muted">
              Opcional. Cada item entra no fim da seção de condições e responsabilidades do documento.
            </p>
            {condicoes.map((condicao) => (
              <div key={condicao.key} className="flex gap-2">
                <Input
                  aria-label="Condição especial"
                  value={condicao.texto}
                  onChange={(e) =>
                    setCondicoes((prev) => prev.map((c) => (c.key === condicao.key ? { ...c, texto: e.target.value } : c)))
                  }
                  placeholder="Ex.: Trabalhos em altura só com autorização prévia da Fiscalização"
                  className="flex-1 min-w-0"
                />
                <IconButton
                  icon={Trash2}
                  label="Remover condição"
                  variant="danger"
                  onClick={() => setCondicoes((prev) => prev.filter((c) => c.key !== condicao.key))}
                />
              </div>
            ))}
            <Button
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={() => setCondicoes((prev) => [...prev, { key: nextKey.current++, texto: "" }])}
            >
              Adicionar condição
            </Button>
          </FormSection>
        </>
      ),
    },
    {
      id: "anexos",
      label: "Anexos",
      icon: Paperclip,
      validate: anexosForm.validate,
      content: <AnexosStep form={anexosForm} />,
    },
    // Situação: só na edição
    ...(ordemServico
      ? [
          {
            id: "situacao",
            label: "Situação",
            icon: Activity,
            content: (
              <FormSection title="Status da Ordem de Serviço" icon={Activity}>
                <SegmentedControl
                  label="Status da ordem de serviço"
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
    <Modal open size="xl" onClose={handleClose}>
      <ModalHeader
        icon={ClipboardList}
        title={ordemServico ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}
        description={
          ordemServico
            ? `Editando: ${ordemServico.numero}${
                ordemServico.status === "ATIVO" &&
                !["DISPENSADA", "AGUARDANDO_EMISSAO"].includes(getFaseEmissao(ordemServico))
                  ? " · alterar o conteúdo reemite a OS e a empresa precisa dar ciência de novo"
                  : ""
              }`
            : "Preencha os dados para cadastrar a ordem de serviço"
        }
        onClose={handleClose}
      />

      <StepForm
        steps={steps}
        isEdit={ordemServico !== null}
        isSubmitting={isLoading}
        submitLabel={ordemServico ? "Salvar Alterações" : "Cadastrar Ordem de Serviço"}
        onCancel={handleClose}
        onSubmit={submit}
        onBlur={createBlurNormalizer(setForm, ORDEM_SERVICO_FIELD_RULES)}
      />
    </Modal>
  );
}
