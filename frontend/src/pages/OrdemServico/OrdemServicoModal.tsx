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
  Plus,
  Trash2,
  CalendarDays,
  HardHat,
  Tag,
  Wrench,
  ShieldCheck,
  ListChecks,
} from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useEmpenhos } from "../../store/empenhos";
import { useContratos } from "../../store/contratos";
import { useOrdensServico } from "../../store/ordensServico";
import { useObras } from "../../store/obras";
import { maskCurrency, formatValueToCurrencyMask, parseCurrencyMask } from "../../utils/masks";
import { formatCurrency } from "../../utils/format-currency";
import type {
  OrdemServico,
  OrdemServicoStatus,
  OrdemServicoUrgencia,
  CreateOrdemServicoPayload,
} from "../../../types/ordem-servico";
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
}

const STATUS_OPTIONS: { value: OrdemServicoStatus; label: string; icon: React.ElementType; activeClass: string; hoverClass: string }[] = [
  { value: "ATIVO", label: "Ativa", icon: Activity, activeClass: "bg-warning-text text-white border-warning-text", hoverClass: "hover:border-warning-border hover:text-warning-text" },
  { value: "FINALIZADO", label: "Finalizada", icon: CheckCircle2, activeClass: "bg-success-text text-white border-success-text", hoverClass: "hover:border-success-border hover:text-success-text" },
  { value: "CANCELADO", label: "Cancelada", icon: XCircle, activeClass: "bg-danger-text text-white border-danger-text", hoverClass: "hover:border-danger-border hover:text-danger-text" },
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

const inputClass =
  "w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all";

const iconInputClass =
  "w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all";

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
      <Icon size={16} className="text-primary-500" />
      <span>{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-text-secondary mb-1.5">
      {children} {required && <span className="text-danger-text">*</span>}
    </label>
  );
}

export function OrdemServicoModal({ ordemServico, handleClose }: OrdemServicoModalProps) {
  const { createOrdemServico, updateOrdemServico, updateOrdemServicoStatus, fetchOrdensServico } = useOrdensServico();
  const { data: empenhosData, fetchListEmpenhos } = useEmpenhos();
  const { data: contratosData, fetchContratos } = useContratos();
  const { obraOptions, fetchObraOptions } = useObras();
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
  const [selectedContratoId, setSelectedContratoId] = useState(ordemServico?.empenho.contrato.id ?? "");
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
  const fiscaisTecnicos = (contratoDados?.fiscais ?? []).filter((f) => f.tipo === "TECNICO");
  const fiscaisAdministrativos = (contratoDados?.fiscais ?? []).filter((f) => f.tipo === "ADMINISTRATIVO");

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

  // Orçamento: o usuário informa o total com BDI; o valor final aplica o desconto do lote
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

  function handleLoteChange(loteId: string) {
    setForm((prev) => ({ ...prev, lote_id: loteId }));
    const novoLote = lotes.find((l) => l.id === loteId);
    if (contratoDados && totalComBdi > 0) {
      syncValorUnico(calcularOrcamento(totalComBdi, contratoDados.bdi, novoLote?.desconto ?? 0).valorFinal);
    }
  }

  function handleContratoChange(contratoId: string) {
    setSelectedContratoId(contratoId);
    // Trocar de contrato zera o que depende dele: empenhos (precisam ser do mesmo contrato), lote e fiscais
    setVinculos([{ key: nextKey.current++, empenho_id: "", valor: "" }]);
    setForm((prev) => ({ ...prev, lote_id: "", fiscalTecnico_id: "", fiscalAdministrativo_id: "" }));
  }

  function handleEmpenhoChange(key: number, empenhoId: string) {
    // Por padrão o empenho vai inteiro; com o orçamento informado e um só empenho, vai o valor final calculado
    const valorPadrao =
      vinculos.length === 1 && orcamento !== null ? orcamento.valorFinal : empenhoId ? saldoLivre(empenhoId) : 0;
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const isCreate = !ordemServico;
    // O número só é digitado na edição de uma OS antiga (as novas têm número gerado pelo sistema)
    if (!isCreate && ordemServico.sequencia === null && !form.numero) {
      toast.error("Preencha o número da ordem de serviço");
      return;
    }
    if (!form.dataInicio || !termino) {
      toast.error("Informe o início e o prazo em dias da ordem de serviço");
      return;
    }
    const mobilizacao = parseInt(form.prazoMobilizacaoDias, 10);
    if (isNaN(mobilizacao) || mobilizacao < 0 || mobilizacao > prazoDiasNum) {
      toast.error("O prazo de mobilização deve ser de 0 até o prazo total da OS");
      return;
    }
    if (!selectedContratoId) {
      toast.error("Selecione o contrato da ordem de serviço");
      return;
    }
    if (lotes.length > 0 && isCreate && !form.lote_id) {
      toast.error("Selecione o lote da ordem de serviço");
      return;
    }

    if (isCreate) {
      const faltando = [
        [form.setorRequisitante, "o setor requisitante"],
        [form.urgencia, "a classificação de urgência"],
        [form.dataVistoria, "a data da vistoria"],
        [form.descricaoProblema.trim(), "a descrição do problema"],
        [totalComBdi > 0 ? "ok" : "", "o total com BDI"],
        [form.fiscalTecnico_id, "o fiscal técnico"],
        [form.fiscalAdministrativo_id, "o fiscal administrativo"],
        [form.fiscalSetorial.trim(), "o fiscal setorial"],
      ].find(([valor]) => !valor);
      if (faltando) {
        toast.error(`Informe ${faltando[1]} da ordem de serviço`);
        return;
      }
    }

    const preenchidos = vinculos.filter((v) => v.empenho_id);
    if (preenchidos.length === 0) {
      toast.error("Vincule pelo menos um empenho à ordem de serviço");
      return;
    }
    for (const v of preenchidos) {
      const valor = parseCurrencyMask(v.valor);
      const numero = empenhos.find((e) => e.id === v.empenho_id)?.numero ?? "";
      if (valor <= 0) {
        toast.error(`Informe o valor destinado do empenho ${numero}`);
        return;
      }
      if (Math.round(valor * 100) > Math.round(saldoLivre(v.empenho_id) * 100)) {
        toast.error(`O valor do empenho ${numero} excede o saldo livre dele (${formatCurrency(saldoLivre(v.empenho_id))})`);
        return;
      }
    }

    const payload: CreateOrdemServicoPayload = {
      ...(isCreate ? {} : { numero: form.numero }),
      empenhos: preenchidos.map((v) => ({ empenho_id: v.empenho_id, valor: parseCurrencyMask(v.valor) })),
      dataInicio: form.dataInicio,
      dataPrevisaoTermino: termino,
      obra_id: obraId || null,
      lote_id: form.lote_id || null,
      setorRequisitante: form.setorRequisitante,
      urgencia: form.urgencia || null,
      dataVistoria: form.dataVistoria || null,
      descricaoProblema: form.descricaoProblema,
      dataEmissao: form.dataEmissao,
      prazoMobilizacaoDias: mobilizacao,
      prazoDias: prazoDiasNum,
      totalComBdi: totalComBdi > 0 ? totalComBdi : null,
      fiscalSetorial: form.fiscalSetorial,
      fiscalTecnico_id: form.fiscalTecnico_id || null,
      fiscalAdministrativo_id: form.fiscalAdministrativo_id || null,
      condicoesEspeciais: condicoes.map((c) => c.texto.trim()).filter(Boolean),
    };

    try {
      setIsLoading(true);
      if (ordemServico) {
        await updateOrdemServico(ordemServico.id, payload);
        toast.success(`Ordem de serviço "${ordemServico.numero}" atualizada com sucesso!`);
      } else {
        const created = await createOrdemServico(payload);
        toast.success(`Ordem de serviço "${created.numero}" criada com sucesso!`);
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
  // OS com número gerado pelo sistema não tem o número editado; as antigas ainda podem corrigi-lo
  const numeroFixo = ordemServico !== null && ordemServico.sequencia !== null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-border">
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

        <form onBlur={createBlurNormalizer(setForm, ORDEM_SERVICO_FIELD_RULES)} className="p-5 overflow-y-auto space-y-5" onSubmit={handleSubmit}>
          {/* Identificação */}
          <div className="space-y-4">
            <SectionTitle icon={Hash} label="Identificação" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label required={ordemServico !== null && !numeroFixo}>Número</Label>
                {!ordemServico ? (
                  <p className="text-sm text-text-secondary rounded-lg border border-dashed border-border bg-surface-muted px-3 py-2.5">
                    Gerado automaticamente ao cadastrar (ex.: OS 010/BAFL/2026-L1)
                  </p>
                ) : numeroFixo ? (
                  <p className="text-sm font-medium text-text-primary rounded-lg border border-border bg-surface-muted px-3 py-2.5">
                    {ordemServico.numero}
                  </p>
                ) : (
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
                )}
              </div>
              <div>
                <Label>Data de emissão</Label>
                <input type="date" name="dataEmissao" value={form.dataEmissao} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Contrato */}
          <div className="space-y-4">
            <SectionTitle icon={FileSignature} label="Contrato" />
            {contratoFixo ? (
              <div className="bg-surface-muted rounded-lg p-4 border border-border flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                  <FileSignature size={18} className="text-primary-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {contratoFixo.identificador} — {contratoFixo.descricaoCurta}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {contratoFixo.company.name} · o contrato da OS não muda; os empenhos abaixo são dele
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <Label required>Contrato</Label>
                <select
                  value={selectedContratoId}
                  onChange={(e) => handleContratoChange(e.target.value)}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="">Selecione um contrato</option>
                  {contratos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.identificador} — {c.descricaoCurta}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {lotes.length > 0 && (
              <div>
                <Label required={!ordemServico}>Lote</Label>
                <div className="relative">
                  <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <select
                    value={form.lote_id}
                    onChange={(e) => handleLoteChange(e.target.value)}
                    disabled={Boolean(ordemServico?.lote_id)}
                    className={`${iconInputClass} cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    <option value="">Selecione o lote</option>
                    {lotes.map((l) => (
                      <option key={l.id} value={l.id}>
                        Lote {String(l.numero).padStart(2, "0")} – {l.nome} (desconto de {String(l.desconto).replace(".", ",")}%)
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  {ordemServico?.lote_id
                    ? "O lote de uma OS já emitida não muda."
                    : "O desconto do lote entra no cálculo do valor da OS."}
                </p>
              </div>
            )}
          </div>

          {/* Empenhos */}
          <div className="space-y-3">
            <SectionTitle icon={Layers2} label="Empenhos" />
            <p className="text-xs text-text-muted">
              Ao escolher o empenho, o valor já vem com todo o saldo livre dele (ou com o valor final calculado, se o
              total com BDI já foi informado). Diminua só se o empenho for dividido entre várias ordens de serviço.
            </p>

            {vinculos.map((vinculo) => {
              const disponiveis = empenhosDoContrato.filter(
                (e) => e.id === vinculo.empenho_id || !vinculos.some((v) => v.empenho_id === e.id),
              );
              const empenho = empenhos.find((e) => e.id === vinculo.empenho_id);
              return (
                <div key={vinculo.key} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={vinculo.empenho_id}
                      onChange={(e) => handleEmpenhoChange(vinculo.key, e.target.value)}
                      disabled={!selectedContratoId}
                      className={`${inputClass} flex-1 min-w-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <option value="">
                        {selectedContratoId ? "Selecione um empenho" : "Selecione um contrato primeiro"}
                      </option>
                      {disponiveis.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.numero} — {e.description}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <div className="relative sm:w-44 flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-medium text-sm">R$</span>
                        <input
                          inputMode="numeric"
                          aria-label="Valor destinado à OS"
                          value={vinculo.valor}
                          onChange={(e) => handleValorChange(vinculo.key, e.target.value)}
                          placeholder="0,00"
                          className={iconInputClass}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVinculo(vinculo.key)}
                        disabled={vinculos.length === 1}
                        title="Remover empenho da OS"
                        className="p-2.5 cursor-pointer text-text-secondary hover:bg-danger-bg hover:text-danger-text rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={16} />
                      </button>
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

            <button
              type="button"
              onClick={addVinculo}
              disabled={!selectedContratoId || vinculos.length >= empenhosDoContrato.length}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 border border-primary-200 bg-primary-50 hover:bg-primary-100 rounded-md cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={14} />
              Adicionar outro empenho
            </button>
          </div>

          {/* Obra: só depois do empenho, para listar apenas as obras dele e do mesmo contrato */}
          <div className="space-y-3">
            <SectionTitle icon={HardHat} label="Obra" />
            <div className="relative">
              <HardHat size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <select
                name="obra_id"
                value={obraId}
                onChange={handleChange}
                disabled={empenhosEscolhidos.length === 0}
                className={`${iconInputClass} cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
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
              </select>
            </div>
            <p className="text-xs text-text-muted">
              {empenhosEscolhidos.length === 0
                ? "Escolha o contrato e o empenho acima para ver as obras disponíveis."
                : "Uma obra pode ter várias OS (ex.: um serviço que faltou vira uma nova OS na mesma obra)."}
            </p>
          </div>

          {/* Serviço */}
          <div className="space-y-4">
            <SectionTitle icon={Wrench} label="Serviço" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label required={!ordemServico}>Setor requisitante</Label>
                <input
                  name="setorRequisitante"
                  value={form.setorRequisitante}
                  onChange={handleChange}
                  placeholder="SCOAM-FL"
                  className={inputClass}
                />
              </div>
              <div>
                <Label required={!ordemServico}>Data da vistoria</Label>
                <input type="date" name="dataVistoria" value={form.dataVistoria} onChange={handleChange} className={inputClass} />
              </div>
            </div>
            <div>
              <Label required={!ordemServico}>Classificação de urgência</Label>
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
                          ? "bg-primary-50 border-primary-300 text-primary-700"
                          : "bg-surface border-border text-text-secondary hover:border-primary-200"
                      }`}
                    >
                      <span className="block text-sm font-medium">{option.label}</span>
                      <span className="block text-xs text-text-muted">{option.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label required={!ordemServico}>Descrição do problema</Label>
              <textarea
                name="descricaoProblema"
                value={form.descricaoProblema}
                onChange={handleChange}
                rows={5}
                placeholder="Descreva o problema encontrado na vistoria e o serviço necessário"
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>

          {/* Cronograma */}
          <div className="space-y-4">
            <SectionTitle icon={CalendarDays} label="Cronograma" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label required>Início</Label>
                <input type="date" name="dataInicio" value={form.dataInicio} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <Label required>Prazo (dias corridos)</Label>
                <input
                  name="prazoDias"
                  inputMode="numeric"
                  value={form.prazoDias}
                  onChange={(e) => setForm((prev) => ({ ...prev, prazoDias: e.target.value.replace(/\D/g, "") }))}
                  placeholder="49"
                  className={inputClass}
                />
              </div>
              <div>
                <Label>Mobilização (dias)</Label>
                <input
                  name="prazoMobilizacaoDias"
                  inputMode="numeric"
                  value={form.prazoMobilizacaoDias}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, prazoMobilizacaoDias: e.target.value.replace(/\D/g, "") }))
                  }
                  placeholder={String(DEFAULT_PRAZO_MOBILIZACAO_DIAS)}
                  className={inputClass}
                />
              </div>
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
          </div>

          {/* Financeiro */}
          <div className="space-y-3">
            <SectionTitle icon={DollarSign} label="Financeiro" />
            <div>
              <Label required={!ordemServico}>Total com BDI (R$)</Label>
              <div className="relative sm:w-64">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-medium text-sm">R$</span>
                <input
                  name="totalComBdi"
                  inputMode="numeric"
                  value={form.totalComBdi}
                  onChange={(e) => handleTotalChange(e.target.value)}
                  placeholder="0,00"
                  className={iconInputClass}
                />
              </div>
              <p className="text-xs text-text-muted mt-1">
                {contratoDados
                  ? `O total sem BDI e o valor final saem dele (BDI de ${String(contratoDados.bdi).replace(".", ",")}%${lote ? ` e desconto de ${String(lote.desconto).replace(".", ",")}%` : ""}).`
                  : "Escolha o contrato para calcular o total sem BDI e o valor final."}
              </p>
            </div>
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
              <p className="text-lg font-semibold text-text-primary">{formatCurrency(valorTotal)}</p>
            </div>
            {valorDifere && orcamento && (
              <p className="text-xs text-warning-text">
                A soma dos empenhos ({formatCurrency(valorTotal)}) é diferente do valor final calculado (
                {formatCurrency(orcamento.valorFinal)}). Ajuste o valor do empenho se o valor oficial da OS for outro.
              </p>
            )}
          </div>

          {/* Fiscais */}
          <div className="space-y-4">
            <SectionTitle icon={ShieldCheck} label="Fiscais" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label required={!ordemServico}>Fiscal técnico</Label>
                <select
                  name="fiscalTecnico_id"
                  value={form.fiscalTecnico_id}
                  onChange={handleChange}
                  disabled={!selectedContratoId}
                  className={`${inputClass} cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="">{selectedContratoId ? "Selecione o fiscal técnico" : "Selecione um contrato primeiro"}</option>
                  {fiscaisTecnicos.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome} – {f.ramal}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label required={!ordemServico}>Fiscal administrativo</Label>
                <select
                  name="fiscalAdministrativo_id"
                  value={form.fiscalAdministrativo_id}
                  onChange={handleChange}
                  disabled={!selectedContratoId}
                  className={`${inputClass} cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="">
                    {selectedContratoId ? "Selecione o fiscal administrativo" : "Selecione um contrato primeiro"}
                  </option>
                  {fiscaisAdministrativos.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome} – {f.ramal}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {selectedContratoId && contratoDados && (fiscaisTecnicos.length === 0 || fiscaisAdministrativos.length === 0) && (
              <p className="text-xs text-warning-text">
                Este contrato não tem fiscal {fiscaisTecnicos.length === 0 ? "técnico" : "administrativo"} cadastrado:
                cadastre em Administrativo &gt; Contratos.
              </p>
            )}
            <div>
              <Label required={!ordemServico}>Fiscal setorial</Label>
              <input
                name="fiscalSetorial"
                value={form.fiscalSetorial}
                onChange={handleChange}
                placeholder="SO RAPHAEL C. – 5012 / raphaelrcc@fab.mil.br"
                className={inputClass}
              />
            </div>
          </div>

          {/* Condições especiais */}
          <div className="space-y-3">
            <SectionTitle icon={ListChecks} label="Condições especiais desta OS" />
            <p className="text-xs text-text-muted">
              Opcional. Cada item entra no fim da seção de condições e responsabilidades do documento.
            </p>
            {condicoes.map((condicao) => (
              <div key={condicao.key} className="flex gap-2">
                <input
                  aria-label="Condição especial"
                  value={condicao.texto}
                  onChange={(e) =>
                    setCondicoes((prev) => prev.map((c) => (c.key === condicao.key ? { ...c, texto: e.target.value } : c)))
                  }
                  placeholder="Ex.: Trabalhos em altura só com autorização prévia da Fiscalização"
                  className={`${inputClass} flex-1 min-w-0`}
                />
                <button
                  type="button"
                  onClick={() => setCondicoes((prev) => prev.filter((c) => c.key !== condicao.key))}
                  title="Remover condição"
                  className="p-2.5 cursor-pointer text-text-secondary hover:bg-danger-bg hover:text-danger-text rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setCondicoes((prev) => [...prev, { key: nextKey.current++, texto: "" }])}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 border border-primary-200 bg-primary-50 hover:bg-primary-100 rounded-md cursor-pointer transition-colors"
            >
              <Plus size={14} />
              Adicionar condição
            </button>
          </div>

          {/* Status (somente edição) */}
          {ordemServico && (
            <div className="space-y-4">
              <SectionTitle icon={Activity} label="Status da Ordem de Serviço" />
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
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
