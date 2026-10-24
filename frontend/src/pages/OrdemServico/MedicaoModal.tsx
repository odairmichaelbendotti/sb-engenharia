import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileDown, Ruler } from "lucide-react";
import { toast } from "sonner";
import type { MedicaoDetalhe, PlanilhaOrcamento } from "../../../types/medicao";
import { useMedicoes } from "../../store/medicoes";
import { formatCurrency, formatDateOnly, formatDateTimeFull } from "../../utils/format-currency";
import { downloadBlob } from "../../utils/download-file";
import { formatQuantidade, parseQuantidade, sanitizeDecimalInput, toDecimalInput, valorItem } from "../../utils/decimal";
import { cx } from "../../utils/cx";
import {
  Button,
  ConfirmDialog,
  Field,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  SegmentedControl,
  StatusPill,
  Table,
  TableBody,
  TableFoot,
  TableHead,
  Td,
  Textarea,
  Th,
  Tr,
} from "../../components/ui";
import { todayInput } from "./ordem-servico-form-utils";
import { medicaoFilename, medicaoStatusDisplay, medicaoTitulo, toDateInput } from "./medicao-display";

const OBSERVACAO_MAX = 2000;

// Linha editável: o máximo é o saldo do item antes desta medição (orçado − medições fechadas)
type Linha = {
  item_id: string;
  codigo: string | null;
  descricao: string;
  unidade: string;
  precoUnitario: number;
  orcado: number;
  anterior: number;
  maximo: number;
};

type Filtro = "todos" | "saldo" | "nesta";

interface MedicaoModalProps {
  open: boolean;
  ordemServicoId: string;
  numeroOs: string;
  planilha: PlanilhaOrcamento;
  // Ausente = nova medição
  medicaoId?: string | null;
  onClose: () => void;
  // Algo foi gravado: a seção recarrega o panorama
  onChanged: () => void;
}

/**
 * Medição da OS: quanto de cada item do orçamento foi executado no período. O rascunho é editável;
 * a fechada (ou qualquer uma para quem só visualiza) abre em leitura, com a planilha congelada.
 */
export function MedicaoModal({
  open,
  ordemServicoId,
  numeroOs,
  planilha,
  medicaoId: medicaoIdInicial = null,
  onClose,
  onChanged,
}: MedicaoModalProps) {
  const { fetchMedicao, createMedicao, updateMedicao, fecharMedicao, fetchMedicaoDocument } = useMedicoes();
  // Muda quando "Salvar e fechar" cria o rascunho mas o fechamento falha: segue editando o criado
  const [medicaoId, setMedicaoId] = useState<string | null>(medicaoIdInicial);
  const [detalhe, setDetalhe] = useState<MedicaoDetalhe | null>(null);
  const [loading, setLoading] = useState(Boolean(medicaoIdInicial));
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const [observacao, setObservacao] = useState("");
  const [quantidades, setQuantidades] = useState<Record<string, string>>({});
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [erro, setErro] = useState<string | null>(null);
  const [saving, setSaving] = useState<"rascunho" | "fechar" | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [baixando, setBaixando] = useState(false);
  // O pai passa uma função nova a cada render: a busca não pode depender dela
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Nova medição: período sugerido (dia seguinte à última fechada, ou início da OS, até hoje)
  useEffect(() => {
    if (medicaoIdInicial) return;
    const hoje = todayInput();
    const inicio = planilha.proximoPeriodoInicio ? toDateInput(planilha.proximoPeriodoInicio) : hoje;
    setPeriodoInicio(inicio);
    setPeriodoFim(inicio > hoje ? inicio : hoje);
  }, [medicaoIdInicial, planilha.proximoPeriodoInicio]);

  useEffect(() => {
    if (!medicaoIdInicial) return;
    let ativo = true;
    setLoading(true);
    fetchMedicao(medicaoIdInicial)
      .then((data) => {
        if (!ativo) return;
        setDetalhe(data);
        setPeriodoInicio(toDateInput(data.periodoInicio));
        setPeriodoFim(toDateInput(data.periodoFim));
        setObservacao(data.observacao ?? "");
        setQuantidades(
          Object.fromEntries(data.linhas.filter((l) => l.esta > 0).map((l) => [l.item_id, toDecimalInput(l.esta)])),
        );
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Erro ao carregar a medição");
        onCloseRef.current();
      })
      .finally(() => ativo && setLoading(false));
    return () => {
      ativo = false;
    };
  }, [medicaoIdInicial, fetchMedicao]);

  // Nova medição criada aqui mesmo (fechamento falhou) continua editável depois que o panorama recarrega
  const editavel = detalhe
    ? detalhe.permissoes.editar
    : !medicaoIdInicial && (planilha.permissoes.criarMedicao || medicaoId !== null);

  // Linhas para editar: da medição (rascunho, com o orçamento atual) ou do panorama (nova)
  const linhas: Linha[] = useMemo(() => {
    if (detalhe) {
      return detalhe.linhas.map((l) => ({
        item_id: l.item_id,
        codigo: l.codigo,
        descricao: l.descricao,
        unidade: l.unidade,
        precoUnitario: l.precoUnitario,
        orcado: l.orcado,
        anterior: l.anterior,
        maximo: Math.max(0, Math.round((l.orcado - l.anterior) * 1000) / 1000),
      }));
    }
    return planilha.itens.map((i) => ({
      item_id: i.id,
      codigo: i.codigo,
      descricao: i.descricao,
      unidade: i.unidade,
      precoUnitario: i.precoUnitario,
      orcado: i.quantidade,
      anterior: i.medido,
      maximo: Math.max(0, i.saldo),
    }));
  }, [detalhe, planilha.itens]);

  const qtd = (item_id: string) => parseQuantidade(quantidades[item_id] ?? "") ?? 0;
  const valorEsta = (l: Linha) => valorItem(l.anterior + qtd(l.item_id), l.precoUnitario) - valorItem(l.anterior, l.precoUnitario);
  const total = linhas.reduce((acc, l) => acc + valorEsta(l), 0);
  const acima = linhas.filter((l) => qtd(l.item_id) > l.maximo);
  const visiveis = linhas.filter((l) =>
    filtro === "saldo" ? l.maximo > 0 : filtro === "nesta" ? qtd(l.item_id) > 0 : true,
  );

  const setQuantidade = (item_id: string, valor: string) => {
    setQuantidades((prev) => ({ ...prev, [item_id]: valor }));
    setErro(null);
  };

  function medirTudo() {
    setQuantidades(Object.fromEntries(linhas.filter((l) => l.maximo > 0).map((l) => [l.item_id, toDecimalInput(l.maximo)])));
    setErro(null);
  }

  function validar(): string | null {
    if (!periodoInicio || !periodoFim) return "Informe o período da medição.";
    if (periodoInicio > periodoFim) return "O início do período precisa ser antes do fim.";
    if (observacao.length > OBSERVACAO_MAX) return `A observação pode ter até ${OBSERVACAO_MAX} caracteres.`;
    const primeira = acima[0];
    if (primeira) {
      return `"${primeira.descricao}": a quantidade passa do saldo (máx. ${formatQuantidade(primeira.maximo)} ${primeira.unidade}).`;
    }
    if (!linhas.some((l) => qtd(l.item_id) > 0)) return "Informe a quantidade executada de ao menos um item.";
    return null;
  }

  async function salvar(fechar: boolean) {
    const problema = validar();
    if (problema) {
      setErro(problema);
      setConfirmando(false);
      return;
    }
    const dados = {
      periodoInicio,
      periodoFim,
      observacao,
      itens: linhas.filter((l) => qtd(l.item_id) > 0).map((l) => ({ item_id: l.item_id, quantidade: qtd(l.item_id) })),
    };
    setSaving(fechar ? "fechar" : "rascunho");
    let id = medicaoId;
    try {
      if (id) await updateMedicao(id, dados);
      else {
        id = await createMedicao(ordemServicoId, dados);
        setMedicaoId(id);
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar a medição");
      setSaving(null);
      setConfirmando(false);
      return;
    }
    onChanged();
    if (!fechar) {
      toast.success("Rascunho da medição salvo");
      setSaving(null);
      onClose();
      return;
    }
    try {
      await fecharMedicao(id);
      toast.success("Medição fechada");
      onChanged();
      onClose();
    } catch (err) {
      // O rascunho ficou gravado: o modal segue nele para corrigir e fechar de novo
      setErro(err instanceof Error ? err.message : "Erro ao fechar a medição");
      setConfirmando(false);
    } finally {
      setSaving(null);
    }
  }

  async function baixarPdf() {
    if (!detalhe) return;
    setBaixando(true);
    try {
      downloadBlob(await fetchMedicaoDocument(detalhe.id), medicaoFilename(detalhe.numero, numeroOs));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar o PDF da medição");
    } finally {
      setBaixando(false);
    }
  }

  const numero = detalhe?.numero ?? (planilha.medicoes.filter((m) => m.id !== medicaoId).at(-1)?.numero ?? 0) + 1;
  const status = detalhe ? medicaoStatusDisplay(detalhe.status) : null;
  const titulo = detalhe ? medicaoTitulo(detalhe.numero) : "Nova medição";

  return (
    <Modal open={open} size="2xl" onClose={onClose}>
      <ModalHeader
        icon={Ruler}
        title={titulo}
        description={
          detalhe?.status === "FECHADA"
            ? `${numeroOs} · fechada em ${formatDateTimeFull(detalhe.fechadaEm ?? detalhe.createdAt)} por ${detalhe.fechadaPorNome ?? "—"}`
            : `${numeroOs} · ${detalhe ? "rascunho: ainda não entra no acumulado" : `será a medição ${String(numero).padStart(2, "0")}`}`
        }
        onClose={onClose}
      />
      <ModalBody className="space-y-4">
        {loading ? (
          <p className="text-sm text-text-muted">Carregando medição...</p>
        ) : editavel ? (
          <>
            {erro && (
              <div className="flex items-start gap-2 rounded-lg border border-danger-border bg-danger-bg px-3 py-2.5">
                <AlertTriangle size={16} className="text-danger-text shrink-0 mt-0.5" />
                <p className="text-sm text-danger-text">{erro}</p>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-[10rem_10rem_1fr] gap-3 items-start">
              <Field label="Início do período" required>
                <Input type="date" size="sm" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} />
              </Field>
              <Field label="Fim do período" required>
                <Input
                  type="date"
                  size="sm"
                  value={periodoFim}
                  min={periodoInicio || undefined}
                  onChange={(e) => setPeriodoFim(e.target.value)}
                />
              </Field>
              <div className="col-span-2 sm:col-span-1 flex flex-wrap items-end justify-between gap-2 sm:pt-5">
                <SegmentedControl<Filtro>
                  label="Itens exibidos"
                  value={filtro}
                  onChange={setFiltro}
                  options={[
                    { value: "todos", label: "Todos" },
                    { value: "saldo", label: "Com saldo" },
                    { value: "nesta", label: "Nesta medição" },
                  ]}
                />
                <Button variant="ghost" size="sm" onClick={medirTudo}>
                  Medir todo o saldo
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <Table compact>
                <TableHead>
                  <Th>Item</Th>
                  <Th className="hidden sm:table-cell">Orçado</Th>
                  <Th className="hidden md:table-cell">Anterior</Th>
                  <Th>Esta medição</Th>
                  <Th>Saldo após</Th>
                </TableHead>
                <TableBody>
                  {visiveis.map((l) => {
                    const esta = qtd(l.item_id);
                    const concluido = l.maximo <= 0;
                    const excede = esta > l.maximo;
                    return (
                      <Tr key={l.item_id} muted={concluido}>
                        <Td>
                          <span className="block text-text-primary line-clamp-2" title={l.descricao}>
                            {l.descricao}
                          </span>
                          <span className="block text-[11px] text-text-muted">
                            {[l.codigo, `${formatCurrency(l.precoUnitario)}/${l.unidade}`].filter(Boolean).join(" · ")}
                          </span>
                        </Td>
                        <Td className="hidden sm:table-cell">
                          {formatQuantidade(l.orcado)} {l.unidade}
                        </Td>
                        <Td className="hidden md:table-cell">{formatQuantidade(l.anterior)}</Td>
                        <Td>
                          {concluido ? (
                            <StatusPill tone="success" size="sm">
                              Concluído
                            </StatusPill>
                          ) : (
                            <div className="w-40 text-left">
                              <Input
                                size="sm"
                                inputMode="decimal"
                                aria-label={`Quantidade executada de ${l.descricao}`}
                                placeholder="0,00"
                                suffix={l.unidade}
                                invalid={excede}
                                value={quantidades[l.item_id] ?? ""}
                                onChange={(e) => setQuantidade(l.item_id, sanitizeDecimalInput(e.target.value))}
                              />
                              <button
                                type="button"
                                className={cx(
                                  "mt-0.5 text-[11px] whitespace-nowrap cursor-pointer hover:underline",
                                  excede ? "text-danger-text" : "text-text-muted",
                                )}
                                title="Preencher com todo o saldo do item"
                                onClick={() => setQuantidade(l.item_id, toDecimalInput(l.maximo))}
                              >
                                máx. {formatQuantidade(l.maximo)} · medir saldo
                              </button>
                            </div>
                          )}
                        </Td>
                        <Td>
                          <span className={cx("block", excede ? "text-danger-text font-semibold" : "text-text-primary")}>
                            {formatQuantidade(Math.round((l.maximo - esta) * 1000) / 1000)}
                          </span>
                          {esta > 0 && <span className="block text-[11px] text-text-muted">{formatCurrency(valorEsta(l))}</span>}
                        </Td>
                      </Tr>
                    );
                  })}
                </TableBody>
              </Table>
              {visiveis.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-text-muted">Nenhum item neste filtro.</p>
              )}
            </div>

            <Field label="Observações" hint="Sai no boletim de medição.">
              <Textarea
                rows={2}
                maxLength={OBSERVACAO_MAX}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </Field>
          </>
        ) : detalhe ? (
          <MedicaoLeitura detalhe={detalhe} />
        ) : null}
      </ModalBody>
      <ModalFooter className="justify-between">
        <div className="min-w-0 flex items-center gap-2 flex-wrap">
          {status && (
            <StatusPill tone={status.tone} title={status.title}>
              {status.label}
            </StatusPill>
          )}
          <p className="text-sm text-text-secondary">
            Valor desta medição{" "}
            <span className="font-semibold text-text-primary tabular-nums">
              {formatCurrency(editavel ? total : (detalhe?.totais.valorEsta ?? 0))}
            </span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {detalhe && (
            <Button variant="secondary" icon={FileDown} loading={baixando} onClick={baixarPdf}>
              Baixar PDF
            </Button>
          )}
          {editavel ? (
            <>
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button variant="secondary" loading={saving === "rascunho"} disabled={saving !== null} onClick={() => salvar(false)}>
                Salvar rascunho
              </Button>
              <Button
                icon={CheckCircle2}
                disabled={saving !== null}
                onClick={() => {
                  const problema = validar();
                  if (problema) setErro(problema);
                  else setConfirmando(true);
                }}
              >
                Salvar e fechar
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          )}
        </div>
      </ModalFooter>

      <ConfirmDialog
        open={confirmando}
        tone="success"
        title={`Fechar a ${medicaoTitulo(numero)}?`}
        confirmLabel="Fechar medição"
        loading={saving === "fechar"}
        onConfirm={() => salvar(true)}
        onCancel={() => setConfirmando(false)}
      >
        A medição de {formatCurrency(total)} entra no acumulado da OS e fica travada. Para corrigir depois, só a última
        medição fechada pode ser reaberta.
      </ConfirmDialog>
    </Modal>
  );
}

// Medição fechada (ou vista por quem não edita): a planilha como foi fechada
function MedicaoLeitura({ detalhe }: { detalhe: MedicaoDetalhe }) {
  const medidas = detalhe.linhas.filter((l) => l.esta > 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-sm">
        <div>
          <p className="text-xs text-text-muted">Período</p>
          <p className="font-medium text-text-primary">
            {formatDateOnly(detalhe.periodoInicio)} a {formatDateOnly(detalhe.periodoFim)}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Acumulado com esta</p>
          <p className="font-medium text-text-primary tabular-nums">{formatCurrency(detalhe.totais.valorAcumulado)}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Saldo a medir</p>
          <p className="font-medium text-text-primary tabular-nums">{formatCurrency(detalhe.totais.valorSaldo)}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Lançada por</p>
          <p className="font-medium text-text-primary truncate">{detalhe.criadoPorNome}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table compact>
          <TableHead>
            <Th>Item</Th>
            <Th className="hidden sm:table-cell">Anterior</Th>
            <Th>Esta medição</Th>
            <Th className="hidden sm:table-cell">Acumulado</Th>
            <Th>Saldo</Th>
          </TableHead>
          <TableBody>
            {medidas.map((l) => (
              <Tr key={l.item_id}>
                <Td>
                  <span className="block text-text-primary line-clamp-2" title={l.descricao}>
                    {l.descricao}
                  </span>
                  <span className="block text-[11px] text-text-muted">
                    {[l.codigo, `${formatQuantidade(l.orcado)} ${l.unidade} orçados`].filter(Boolean).join(" · ")}
                  </span>
                </Td>
                <Td className="hidden sm:table-cell">{formatQuantidade(l.anterior)}</Td>
                <Td>
                  <span className="block font-semibold text-text-primary">
                    {formatQuantidade(l.esta)} {l.unidade}
                  </span>
                  <span className="block text-[11px] text-text-muted">{formatCurrency(l.valorEsta)}</span>
                </Td>
                <Td className="hidden sm:table-cell">{formatQuantidade(l.acumulado)}</Td>
                <Td>{l.saldo <= 0 ? "Concluído" : formatQuantidade(l.saldo)}</Td>
              </Tr>
            ))}
          </TableBody>
          <TableFoot>
            <Tr>
              <Td>Total desta medição</Td>
              <Td className="hidden sm:table-cell" />
              <Td>{formatCurrency(detalhe.totais.valorEsta)}</Td>
              <Td className="hidden sm:table-cell" />
              <Td />
            </Tr>
          </TableFoot>
        </Table>
      </div>
      {detalhe.observacao && (
        <div>
          <p className="text-xs text-text-muted mb-1">Observações</p>
          <p className="text-sm text-text-primary whitespace-pre-line">{detalhe.observacao}</p>
        </div>
      )}
      {detalhe.reabertaEm && (
        <p className="text-xs text-text-muted">
          Reaberta em {formatDateTimeFull(detalhe.reabertaEm)} por {detalhe.reabertaPorNome ?? "—"}.
        </p>
      )}
    </div>
  );
}
