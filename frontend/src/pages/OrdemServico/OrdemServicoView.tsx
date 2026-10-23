import { lazy, Suspense, useState } from "react";
import {
  ClipboardList,
  Building2,
  HardHat,
  AlertTriangle,
  CalendarPlus,
  CalendarClock,
  CalendarCheck,
  Flag,
  UserCog,
  MapPinOff,
  FileDown,
  FileSignature,
  FileText,
  Layers2,
  Link2,
  Tag,
  Wrench,
  ShieldCheck,
  CalendarSearch,
  Timer,
  Banknote,
  MessagesSquare,
  MapPinned,
} from "lucide-react";
import { toast } from "sonner";
import type { OrdemServico, OrdemServicoObra, OrdemServicoUrgencia } from "../../../types/ordem-servico";
import { formatCurrency, formatDate, formatDateOnly } from "../../utils/format-currency";
import { downloadBlob, toFilename } from "../../utils/download-file";
import { cx } from "../../utils/cx";
import { invoiceStatusDisplay, invoiceLabel } from "../../utils/status-display";
import { useOrdensServico } from "../../store/ordensServico";
import { useInvoice } from "../../store/invoices";
import { useTramitacao } from "../../store/tramitacao";
import { usePermission } from "../../hooks/usePermission";
import { getBalance, getOrdemServicoBalance } from "./ordem-servico-balance";
import { FinalizeOrdemServicoCallout } from "./FinalizeOrdemServico";
import { CienciaPendenteAviso, TramitacaoSection } from "./TramitacaoSection";
import { getFaseEmissao } from "./ordem-servico-ciencia";
import { ordemServicoStatusDisplay } from "./ordem-servico-display";
import {
  Button,
  CodeTag,
  FormSection,
  RelationCard,
  RelationGrid,
  StatusPill,
  Table,
  TableBody,
  TableFoot,
  TableHead,
  Td,
  Th,
  Tr,
} from "../../components/ui";
import { EmptyNote, ViewFrame, type ViewProps } from "../../components/EntityViewer/ViewFrame";
import { useViewerNav } from "../../components/EntityViewer/useViewerNav";
import { useEnsureData } from "../../components/EntityViewer/useEnsureData";

// Leaflet só é baixado quando o modal de uma OS com obra georreferenciada abre
const ObraMiniMap = lazy(() => import("./ObraMiniMap"));

const MAP_HEIGHT_CLASS = "h-52";

function hasValidCoordinates(obra: OrdemServicoObra): obra is OrdemServicoObra & {
  latitude: number;
  longitude: number;
} {
  return (
    typeof obra.latitude === "number" &&
    typeof obra.longitude === "number" &&
    Math.abs(obra.latitude) <= 90 &&
    Math.abs(obra.longitude) <= 180
  );
}

const URGENCIA_LABEL: Record<OrdemServicoUrgencia, string> = {
  EMERGENCIA: "Emergência (imediato – 24-48h)",
  URGENCIA: "Urgência (1-2 semanas)",
  PROGRAMADA: "Programada (1-3 meses)",
  PREVENTIVA: "Preventiva (conforme disp. técnica e orçamentária)",
};

const OBRA_STATUS_LABEL: Record<string, string> = {
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  PARALISADA: "Paralisada",
  CANCELADA: "Cancelada",
};

const OBRA_TIPO_LABEL: Record<string, string> = {
  CONSTRUCAO: "Construção",
  REFORMA: "Reforma",
  AMPLIACAO: "Ampliação",
  PAVIMENTACAO: "Pavimentação",
  SANEAMENTO: "Saneamento",
  MANUTENCAO_PREDIAL: "Manutenção predial",
  OUTRO: "Outro",
};

function InfoItem({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Building2;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <Icon size={14} className="text-text-muted mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-text-muted leading-none">{label}</p>
        <p className="text-sm font-medium text-text-primary mt-1 wrap-break-word">{children}</p>
      </div>
    </div>
  );
}

function DateStep({
  icon: Icon,
  label,
  value,
  hint,
  done,
}: {
  icon: typeof Building2;
  label: string;
  value: string | null;
  hint?: string;
  done: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${
        done ? "border-border-strong bg-surface" : "border-border bg-surface-muted"
      }`}
    >
      <div className="flex items-center gap-1.5 text-xs text-text-muted">
        <Icon size={14} className={done ? "text-text-primary" : "text-text-muted"} />
        {label}
      </div>
      <p
        className={`text-sm font-semibold mt-1 ${
          value ? "text-text-primary" : "text-text-muted font-normal"
        }`}
      >
        {value ?? "—"}
      </p>
      {hint && <p className="text-xs text-text-muted mt-0.5">{hint}</p>}
    </div>
  );
}

function ObraLocation({ ordemServico, obra }: { ordemServico: OrdemServico; obra: OrdemServicoObra }) {
  if (!hasValidCoordinates(obra)) {
    return (
      <div
        className={`${MAP_HEIGHT_CLASS} flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-surface-muted text-center px-4`}
      >
        <MapPinOff size={20} className="text-text-muted" />
        <p className="text-sm text-text-secondary">Obra sem coordenadas cadastradas</p>
        <p className="text-xs text-text-muted">
          Informe latitude e longitude ao editar a obra em Engenharia &gt; Obras.
        </p>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className={`${MAP_HEIGHT_CLASS} rounded-lg border border-border bg-surface-muted animate-pulse`} />
      }
    >
      <ObraMiniMap
        latitude={obra.latitude}
        longitude={obra.longitude}
        color={ordemServico.empenho.contrato.cor}
        label={obra.identificacaoPatrimonial}
      />
    </Suspense>
  );
}

function ObraSection({ ordemServico, obra }: { ordemServico: OrdemServico; obra: OrdemServicoObra }) {
  return (
    <div className="space-y-3">
      <ObraLocation ordemServico={ordemServico} obra={obra} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        <InfoItem icon={HardHat} label="Obra">
          {obra.nome}
        </InfoItem>
        <InfoItem icon={ClipboardList} label="Identificação patrimonial">
          {obra.identificacaoPatrimonial}
        </InfoItem>
        <InfoItem icon={HardHat} label="Tipo / Situação">
          {OBRA_TIPO_LABEL[obra.tipo] ?? obra.tipo} · {OBRA_STATUS_LABEL[obra.status] ?? obra.status}
        </InfoItem>
        <InfoItem icon={UserCog} label="Responsável técnico">
          {obra.responsavelTecnico}
        </InfoItem>
      </div>
    </div>
  );
}

// Dados que entram no PDF da OS: mostra o que está cadastrado e o que falta (OS antigas)
function DocumentSection({ ordemServico }: { ordemServico: OrdemServico }) {
  const {
    lote,
    setorRequisitante,
    urgencia,
    dataVistoria,
    prazoDias,
    prazoMobilizacaoDias,
    totalComBdi,
    fiscalTecnico,
    fiscalAdministrativo,
    fiscalSetorial,
    condicoesEspeciais,
  } = ordemServico;
  const incompleta = !setorRequisitante || !urgencia || !dataVistoria || !totalComBdi || !fiscalTecnico;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {lote && (
          <InfoItem icon={Tag} label="Lote">
            {String(lote.numero).padStart(2, "0")} – {lote.nome} · desconto de {String(lote.desconto).replace(".", ",")}%
          </InfoItem>
        )}
        <InfoItem icon={Wrench} label="Setor requisitante">
          {setorRequisitante ?? "—"}
        </InfoItem>
        <InfoItem icon={AlertTriangle} label="Classificação de urgência">
          {urgencia ? URGENCIA_LABEL[urgencia] : "—"}
        </InfoItem>
        <InfoItem icon={CalendarSearch} label="Data da vistoria">
          {dataVistoria ? formatDateOnly(dataVistoria) : "—"}
        </InfoItem>
        <InfoItem icon={Timer} label="Prazo">
          {prazoDias ? `${prazoDias} dias corridos (mobilização de ${prazoMobilizacaoDias})` : "—"}
        </InfoItem>
        <InfoItem icon={Banknote} label="Total com BDI">
          {totalComBdi ? formatCurrency(totalComBdi) : "—"}
        </InfoItem>
        <InfoItem icon={ShieldCheck} label="Fiscal técnico">
          {fiscalTecnico ? `${fiscalTecnico.nome} – ${fiscalTecnico.ramal}` : "—"}
        </InfoItem>
        <InfoItem icon={ShieldCheck} label="Fiscal administrativo">
          {fiscalAdministrativo ? `${fiscalAdministrativo.nome} – ${fiscalAdministrativo.ramal}` : "—"}
        </InfoItem>
        <InfoItem icon={ShieldCheck} label="Fiscal setorial">
          {fiscalSetorial ?? "—"}
        </InfoItem>
      </div>
      {condicoesEspeciais.length > 0 && (
        <div>
          <p className="text-xs text-text-muted mb-1">Condições especiais</p>
          <ul className="list-disc pl-5 space-y-0.5 text-sm text-text-primary">
            {condicoesEspeciais.map((condicao) => (
              <li key={condicao}>{condicao}</li>
            ))}
          </ul>
        </div>
      )}
      {incompleta && (
        <div className="flex items-start gap-2.5 rounded-lg border border-warning-border bg-warning-bg px-3.5 py-3">
          <AlertTriangle size={16} className="text-warning-text shrink-0 mt-0.5" />
          <p className="text-sm text-warning-text">
            Esta ordem de serviço tem dados do documento em branco. Edite-a para completar: o PDF sai com esses campos
            vazios.
          </p>
        </div>
      )}
    </div>
  );
}

function BalanceSection({ ordemServico, canFinalize }: { ordemServico: OrdemServico; canFinalize: boolean }) {
  const balance = getOrdemServicoBalance(ordemServico);

  if (balance.kind === "paid" && ordemServico.status === "ATIVO") {
    return <FinalizeOrdemServicoCallout ordemServico={ordemServico} canFinalize={canFinalize} />;
  }

  const fill =
    balance.kind === "over" ? "bg-danger-text" : balance.kind === "paid" ? "bg-secondary-500" : "bg-primary-500";

  return (
    <div>
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
            {balance.kind === "over" ? "Liquidado acima do valor" : balance.kind === "paid" ? "Saldo" : "A liquidar nesta OS"}
          </p>
          <p
            className={`text-2xl font-bold tabular-nums tracking-tight mt-0.5 ${
              balance.kind === "over" ? "text-danger-text" : balance.kind === "paid" ? "text-success-text" : "text-text-primary"
            }`}
          >
            {balance.kind === "over"
              ? formatCurrency(balance.excesso)
              : balance.kind === "paid"
                ? "Quitada"
                : formatCurrency(balance.saldo)}
          </p>
        </div>
        <p className="text-xs text-text-secondary text-right tabular-nums">
          {balance.percent}% liquidado
          <br />
          de {formatCurrency(balance.valor)}
        </p>
      </div>
      <div className="h-2.5 mt-2.5 rounded-full bg-surface-muted overflow-hidden">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${Math.min(100, balance.percent)}%` }} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-text-secondary tabular-nums">
        <span className="inline-flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-sm ${fill}`} />
          Liquidado {formatCurrency(balance.liquidado)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-surface-muted border border-border" />
          A liquidar {formatCurrency(balance.saldo)}
        </span>
      </div>
    </div>
  );
}

// Quanto cada empenho destinou à OS, quanto já foi liquidado nele e o saldo livre do empenho
function EmpenhosTable({ ordemServico }: { ordemServico: OrdemServico }) {
  const { linkTo } = useViewerNav();
  const totals = ordemServico.empenhos.reduce(
    (acc, v) => ({ valor: acc.valor + v.valor, liquidado: acc.liquidado + v.liquidado }),
    { valor: 0, liquidado: 0 },
  );

  // Saldo livre de cada empenho para novas OS: fica fora da tabela, numa linha só
  const livre = ordemServico.empenhos.reduce((acc, v) => acc + Math.max(0, v.empenhoValue - v.empenhoComprometido), 0);

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-border overflow-hidden">
      <Table compact>
        <TableHead>
          <Th>Empenho</Th>
          <Th>Destinado à OS</Th>
          <Th>Liquidado</Th>
          <Th>A liquidar</Th>
        </TableHead>
        <TableBody>
          {ordemServico.empenhos.map((v) => {
            const saldo = getBalance(v.valor, v.liquidado);
            const livreEmpenho = Math.max(0, v.empenhoValue - v.empenhoComprometido);
            return (
              <Tr key={v.empenho_id} onOpen={linkTo("empenho", v.empenho_id)}>
                <Td>
                  <div
                    title={`${v.numero} · ${v.description}\nEmpenho de ${formatCurrency(v.empenhoValue)} · ${formatCurrency(livreEmpenho)} livres para novas OS`}
                  >
                    <span className="block font-mono text-[13px] text-text-primary">{v.numero}</span>
                    <span className="block text-xs text-text-muted mt-0.5 line-clamp-2">{v.description}</span>
                  </div>
                </Td>
                <Td>{formatCurrency(v.valor)}</Td>
                <Td>{formatCurrency(v.liquidado)}</Td>
                <Td>
                  <span
                    className={cx(
                      "font-semibold",
                      saldo.kind === "over" ? "text-danger-text" : saldo.saldo === 0 ? "text-success-text" : "text-text-primary",
                    )}
                  >
                    {saldo.kind === "over" ? `+${formatCurrency(saldo.excesso)}` : formatCurrency(saldo.saldo)}
                  </span>
                </Td>
              </Tr>
            );
          })}
        </TableBody>
        {ordemServico.empenhos.length > 1 && (
          <TableFoot>
            <Tr>
              <Td>Total</Td>
              <Td>{formatCurrency(totals.valor)}</Td>
              <Td>{formatCurrency(totals.liquidado)}</Td>
              <Td>{formatCurrency(Math.max(0, totals.valor - totals.liquidado))}</Td>
            </Tr>
          </TableFoot>
        )}
      </Table>
      </div>
      <p className="text-xs text-text-muted tabular-nums">
        {livre > 0
          ? `${formatCurrency(livre)} livres ${ordemServico.empenhos.length > 1 ? "nestes empenhos" : "neste empenho"} para novas OS`
          : "Sem saldo livre para novas OS"}
      </p>
    </div>
  );
}

// Notas fiscais lançadas nesta OS (só para quem vê o administrativo)
function NotasSection({ ordemServico }: { ordemServico: OrdemServico }) {
  const { linkTo } = useViewerNav();
  const loading = useEnsureData("invoices");
  const allInvoices = useInvoice((s) => s.allInvoices);
  const notas = allInvoices
    .filter((nf) => nf.ordemServico_id === ordemServico.id || nf.ordemServico?.id === ordemServico.id)
    .sort((a, b) => new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime());

  return (
    <FormSection title="Notas fiscais da OS" icon={FileText} count={notas.length}>
      {loading ? (
        <EmptyNote>Carregando notas...</EmptyNote>
      ) : notas.length === 0 ? (
        <EmptyNote>Nenhuma nota fiscal lançada nesta OS.</EmptyNote>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table compact>
            <TableHead>
              <Th>Nota</Th>
              <Th>Status</Th>
              <Th>Vencimento</Th>
              <Th>Valor</Th>
            </TableHead>
            <TableBody>
              {notas.map((nf) => {
                const st = invoiceStatusDisplay(nf.status);
                return (
                  <Tr key={nf.id} onOpen={linkTo("invoice", nf.id)} muted={nf.status.toUpperCase() === "CANCELADO"}>
                    <Td>
                      <span className="font-semibold text-text-primary">{invoiceLabel(nf.numero)}</span>
                      <span className="block text-[11px] text-text-muted line-clamp-1">{nf.description}</span>
                    </Td>
                    <Td>
                      <StatusPill tone={st.tone} size="sm">
                        {st.label}
                      </StatusPill>
                    </Td>
                    <Td>{formatDateOnly(nf.vencimento)}</Td>
                    <Td>{formatCurrency(nf.value)}</Td>
                  </Tr>
                );
              })}
            </TableBody>
            <TableFoot>
              <Tr>
                <Td>Liquidado na OS</Td>
                <Td />
                <Td />
                <Td>{formatCurrency(ordemServico.valorExecutado)}</Td>
              </Tr>
            </TableFoot>
          </Table>
        </div>
      )}
    </FormSection>
  );
}

// `ordemServico` direto (sem buscar a lista): tela de pendências da empresa, que pode estar bloqueada
export function OrdemServicoView({
  id,
  ordemServico: given,
  onTramitacaoChanged,
  ...frame
}: ViewProps & { ordemServico?: OrdemServico; onTramitacaoChanged?: () => void }) {
  const loading = useEnsureData("ordensServico", !given);
  const fromStore = useOrdensServico((s) => s.data?.ordensServico.find((os) => os.id === id));
  const ordemServico = given ?? fromStore;
  const fetchOrdensServico = useOrdensServico((s) => s.fetchOrdensServico);
  const fetchOrdemServicoDocument = useOrdensServico((s) => s.fetchOrdemServicoDocument);
  const fetchPendencias = useTramitacao((s) => s.fetchPendencias);
  const { canEditAdministrativo, canViewAdministrativo, canDarCienciaOrdemServico, isEmpresaRestricted } = usePermission();
  const { linkTo } = useViewerNav();
  const [generating, setGenerating] = useState(false);

  if (!ordemServico) return <ViewFrame {...frame} size="xl" loading={loading} notFound={!loading} />;

  const { obra, empenho } = ordemServico;
  const { contrato } = empenho;
  const status = ordemServicoStatusDisplay(ordemServico);
  const fase = getFaseEmissao(ordemServico);
  const aguardandoCiencia =
    canDarCienciaOrdemServico &&
    ordemServico.status === "ATIVO" &&
    (fase === "AGUARDANDO_CIENCIA" || fase === "CIENCIA_VENCIDA");

  // Ciência, apontamento ou decisão: atualiza a lista (fase da OS) e as pendências da empresa
  const handleTramitacaoChanged = () => {
    fetchOrdensServico().catch(() => {});
    if (isEmpresaRestricted) fetchPendencias().catch(() => {});
    onTramitacaoChanged?.();
  };

  async function handleGenerateDocument() {
    if (!ordemServico) return;
    setGenerating(true);
    try {
      const blob = await fetchOrdemServicoDocument(ordemServico.id);
      downloadBlob(blob, `${toFilename(ordemServico.numero)}.pdf`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar o documento da ordem de serviço");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <ViewFrame
      {...frame}
      size="xl"
      accent={contrato.cor}
      eyebrow={
        <>
          <CodeTag>{/^OS\b/i.test(ordemServico.numero) ? ordemServico.numero : `OS ${ordemServico.numero}`}</CodeTag>
          <StatusPill tone={status.tone} title={status.title}>
            {status.label}
          </StatusPill>
          <span className="truncate">
            {contrato.company.name} <span className="text-text-muted">·</span> {contrato.identificador}
          </span>
        </>
      }
      title={obra?.nome ?? empenho.description}
      editLabel="Editar OS"
      headerActions={
        <Button
          variant="secondary"
          size="sm"
          icon={FileDown}
          loading={generating}
          onClick={handleGenerateDocument}
          title="Baixar a ordem de serviço preenchida em PDF"
        >
          <span className="hidden sm:inline">Baixar PDF</span>
        </Button>
      }
    >
      {aguardandoCiencia && ordemServico.cienciaPrazoAte && (
        <CienciaPendenteAviso prazoAte={ordemServico.cienciaPrazoAte} vencida={fase === "CIENCIA_VENCIDA"} />
      )}

      <section>
        <BalanceSection ordemServico={ordemServico} canFinalize={canEditAdministrativo} />
      </section>

      <FormSection title="Vínculos" icon={Link2}>
        <RelationGrid>
          <RelationCard
            icon={FileSignature}
            label="Contrato"
            title={contrato.identificador}
            color={contrato.cor}
            hint={contrato.descricaoCurta}
            onClick={linkTo("contrato", contrato.id)}
          />
          <RelationCard
            icon={Building2}
            label="Empresa"
            title={contrato.company.name}
            onClick={linkTo("empresa", contrato.company.id)}
          />
          {obra ? (
            <RelationCard
              icon={HardHat}
              label="Obra"
              title={`${obra.identificacaoPatrimonial} · ${obra.nome}`}
              hint={`${OBRA_TIPO_LABEL[obra.tipo] ?? obra.tipo} · ${OBRA_STATUS_LABEL[obra.status] ?? obra.status}`}
              onClick={linkTo("obra", obra.id)}
            />
          ) : (
            <RelationCard
              icon={HardHat}
              label="Obra"
              title="Sem obra vinculada"
              hint="vincule pela edição da OS ou da obra"
              hintTone="warning"
            />
          )}
        </RelationGrid>
      </FormSection>

      <FormSection
        title={ordemServico.empenhos.length > 1 ? "Empenhos" : "Empenho"}
        icon={Layers2}
        count={ordemServico.empenhos.length}
      >
        <EmpenhosTable ordemServico={ordemServico} />
      </FormSection>

      {canViewAdministrativo && <NotasSection ordemServico={ordemServico} />}

      <FormSection title="Cronograma" icon={CalendarClock}>
        <p className="-mt-2 text-xs text-text-muted">
          {ordemServico.dataInicio
            ? "Prazos de execução desta ordem de serviço."
            : "Esta ordem de serviço ainda não tem prazo: edite-a e informe o início e a previsão de término."}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <DateStep
            icon={CalendarPlus}
            label="Emissão da OS"
            value={ordemServico.dataEmissao ? formatDateOnly(ordemServico.dataEmissao) : formatDate(ordemServico.createdAt)}
            done
          />
          <DateStep
            icon={CalendarClock}
            label="Início"
            value={ordemServico.dataInicio ? formatDateOnly(ordemServico.dataInicio) : null}
            done={!!ordemServico.dataInicio}
          />
          <DateStep
            icon={Flag}
            label="Previsão de término"
            value={ordemServico.dataPrevisaoTermino ? formatDateOnly(ordemServico.dataPrevisaoTermino) : null}
            done={!!ordemServico.dataPrevisaoTermino}
          />
          <DateStep
            icon={CalendarCheck}
            label="Conclusão da obra"
            value={obra?.dataConclusao ? formatDate(obra.dataConclusao) : null}
            hint={obra && !obra.dataConclusao ? "Ainda não concluída" : undefined}
            done={!!obra?.dataConclusao}
          />
        </div>
      </FormSection>

      <FormSection title="Documento da OS" icon={FileText}>
        <DocumentSection ordemServico={ordemServico} />
      </FormSection>

      <FormSection title="Ciência e tramitação com a empresa" icon={MessagesSquare}>
        <TramitacaoSection
          ordemServicoId={ordemServico.id}
          numero={ordemServico.numero}
          onChanged={handleTramitacaoChanged}
        />
      </FormSection>

      {obra && (
        <FormSection title="Local da obra" icon={MapPinned}>
          <ObraSection ordemServico={ordemServico} obra={obra} />
        </FormSection>
      )}
    </ViewFrame>
  );
}
