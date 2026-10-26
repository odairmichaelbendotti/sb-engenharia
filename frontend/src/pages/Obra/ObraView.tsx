import { lazy, Suspense, useState } from "react";
import {
  AlignLeft,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileSignature,
  FileText,
  HardHat,
  Hash,
  Link2,
  MapPinned,
  Ruler,
  StickyNote,
  Tag,
  UserCog,
} from "lucide-react";
import type { Obra, ObraOrdemServico } from "../../../types/obra";
import type { OrdemServicoStatus } from "../../../types/ordem-servico";
import { formatCurrency, formatDate, formatDateOnly } from "../../utils/format-currency";
import { cx } from "../../utils/cx";
import { invoiceStatusDisplay, obraStatusDisplay, invoiceLabel } from "../../utils/status-display";
import { usePermission } from "../../hooks/usePermission";
import { useObras } from "../../store/obras";
import { getOrdemServicoSchedule, type ScheduleTone } from "../OrdemServico/ordem-servico-schedule";
import { getBalance } from "../OrdemServico/ordem-servico-balance";
import { OBRA_TIPO_LABEL, getObraBalance, getObraDeadlineHint, isObraOverdue } from "./obra-display";
import { CompleteObraDialog } from "./CompleteObraDialog";
import {
  Button,
  CodeTag,
  DetailGrid,
  DetailItem,
  FormSection,
  RelationCard,
  RelationGrid,
  StatTile,
  StatTiles,
  StatusPill,
  Table,
  TableBody,
  TableHead,
  Td,
  Th,
  Tr,
} from "../../components/ui";
import { EmptyNote, ViewFrame, type ViewProps } from "../../components/EntityViewer/ViewFrame";
import { useViewerNav } from "../../components/EntityViewer/useViewerNav";
import { useEnsureData } from "../../components/EntityViewer/useEnsureData";

// Leaflet só é baixado quando a obra tem coordenadas
const ObraMiniMap = lazy(() => import("../OrdemServico/ObraMiniMap"));

const OS_STATUS: Record<string, { label: string; tone: "active" | "closed" }> = {
  ATIVO: { label: "Ativa", tone: "active" },
  FINALIZADO: { label: "Finalizada", tone: "closed" },
  CANCELADO: { label: "Cancelada", tone: "closed" },
};

const TONE_FILL: Record<ScheduleTone, string> = {
  danger: "bg-danger-dot",
  warning: "bg-warning-dot",
  success: "bg-progress",
  neutral: "bg-border-strong",
};

const SCHEDULE_TEXT: Record<ScheduleTone, string> = {
  danger: "text-danger-text font-semibold",
  warning: "text-warning-text font-semibold",
  success: "text-text-muted",
  neutral: "text-text-muted",
};

function percentOf(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function Bar({ percent, className }: { percent: number; className: string }) {
  return (
    <div className="h-1.5 rounded-full bg-progress-track overflow-hidden">
      <div className={cx("h-full rounded-full", className)} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
  );
}

// OS executada na obra: prazo e liquidado; clicar abre a OS no mesmo modal
function OrdemServicoCard({ os, obra, onOpen }: { os: ObraOrdemServico; obra: Obra; onOpen?: () => void }) {
  const schedule = getOrdemServicoSchedule({
    status: os.status as OrdemServicoStatus,
    dataInicio: os.dataInicio,
    dataPrevisaoTermino: os.dataPrevisaoTermino,
    obra: { status: obra.status, dataConclusao: obra.dataConclusao ?? null },
  });
  const status = OS_STATUS[os.status] ?? OS_STATUS.CANCELADO!;
  const elapsed = Math.round((schedule.elapsedRatio ?? 0) * 100);
  const executado = percentOf(os.valorExecutado, os.valor);
  const showToday = schedule.kind !== "concluded" && schedule.kind !== "inactive";

  const body = (
    <>
      <span aria-hidden className="absolute left-0 inset-y-0 w-1" style={{ backgroundColor: os.contrato.cor }} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <CodeTag>{/^OS\b/i.test(os.numero) ? os.numero : `OS ${os.numero}`}</CodeTag>
            <StatusPill tone={schedule.kind === "overdue" ? "danger" : status.tone} size="sm">
              {status.label}
            </StatusPill>
          </div>
          <p className="text-xs text-text-muted mt-1 truncate">
            {os.contrato.identificador} · {os.contrato.company.name}
            {os.empenhos.length > 0 && <> · {os.empenhos.map((e) => e.numero).join(", ")}</>}
          </p>
        </div>
        <p className="text-sm font-semibold text-text-primary tabular-nums shrink-0">{formatCurrency(os.valor)}</p>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3 text-left">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-text-muted">Prazo</span>
            <span className={cx("text-[11px]", SCHEDULE_TEXT[schedule.tone])}>{schedule.label}</span>
          </div>
          {os.dataInicio && os.dataPrevisaoTermino ? (
            <>
              <div className="mt-2 relative">
                <Bar percent={elapsed} className={TONE_FILL[schedule.tone]} />
                {showToday && (
                  <span
                    className={cx(
                      "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-surface",
                      TONE_FILL[schedule.tone],
                    )}
                    style={{ left: `${elapsed}%` }}
                    title="Hoje"
                  />
                )}
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-text-muted tabular-nums">
                <span>{formatDateOnly(os.dataInicio)}</span>
                <span>{formatDateOnly(os.dataPrevisaoTermino)}</span>
              </div>
            </>
          ) : (
            <p className="mt-2 text-xs text-text-muted">Informe o início e a previsão de término no cadastro da OS.</p>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-text-muted">Liquidado</span>
            <span className={cx("font-semibold tabular-nums", executado > 100 ? "text-danger-text" : "text-text-secondary")}>
              {executado}%
            </span>
          </div>
          <div className="mt-2">
            <Bar percent={executado} className={executado > 100 ? "bg-danger-text" : executado >= 100 ? "bg-success-text" : "bg-primary-500"} />
          </div>
          <p className="mt-1 text-[11px] text-text-muted tabular-nums">
            {formatCurrency(os.valorExecutado)} de {formatCurrency(os.valor)}
            {os.status === "ATIVO" && <> · falta {formatCurrency(getBalance(os.valor, os.valorExecutado).saldo)}</>}
          </p>
        </div>
      </div>
    </>
  );

  const base = "relative block w-full rounded-lg border border-border bg-surface pl-4 pr-3.5 py-3 overflow-hidden";
  return (
    <li>
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          className={cx(
            base,
            "cursor-pointer transition-colors hover:border-border-strong hover:bg-surface-muted/50",
            "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary-200",
          )}
        >
          {body}
        </button>
      ) : (
        <div className={base}>{body}</div>
      )}
    </li>
  );
}

export function ObraView({ id, ...frame }: ViewProps) {
  const loading = useEnsureData("obras");
  const obra = useObras((s) => s.data?.obras.find((o) => o.id === id));
  const { canEditEngenharia, canViewAdministrativo } = usePermission();
  const { linkTo } = useViewerNav();
  const [completing, setCompleting] = useState(false);

  if (!obra) return <ViewFrame {...frame} size="xl" loading={loading} notFound={!loading} />;

  const status = obraStatusDisplay(obra.status, isObraOverdue(obra));
  const executado = percentOf(obra.valorExecutado, obra.valor);
  const balance = getObraBalance(obra);
  const hint = getObraDeadlineHint(obra);
  const empresas = [...new Map(obra.ordensServico.map((os) => [os.contrato.company.id, os.contrato.company])).values()];
  const contratos = [...new Map(obra.ordensServico.map((os) => [os.contrato.id, os.contrato])).values()];
  if (contratos.length === 0 && obra.contrato) contratos.push(obra.contrato);
  if (empresas.length === 0 && obra.contrato) empresas.push(obra.contrato.company);
  const notas = [...(obra.invoices ?? [])].sort((a, b) => new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime());
  const hasCoordinates =
    typeof obra.latitude === "number" &&
    typeof obra.longitude === "number" &&
    Math.abs(obra.latitude) <= 90 &&
    Math.abs(obra.longitude) <= 180;

  return (
    <ViewFrame
      {...frame}
      size="xl"
      accent={obra.contrato?.cor}
      eyebrow={
        <>
          <CodeTag>{obra.identificacaoPatrimonial}</CodeTag>
          <StatusPill tone={status.tone} title={status.title}>
            {status.label}
          </StatusPill>
          <span className="truncate">
            {OBRA_TIPO_LABEL[obra.tipo] ?? obra.tipo}
            {empresas[0] && (
              <>
                {" "}
                <span className="text-text-muted">·</span> {empresas.map((e) => e.name).join(", ")}
              </>
            )}
          </span>
        </>
      }
      title={obra.nome}
      editLabel="Editar obra"
      footerActions={
        canEditEngenharia &&
        balance.kind === "paid" && (
          <Button variant="success" icon={CheckCircle2} onClick={() => setCompleting(true)}>
            Concluir obra
          </Button>
        )
      }
    >
      <section className="space-y-3">
        <StatTiles>
          <StatTile label="Emitido em OS" value={formatCurrency(obra.valor)} hint={`${obra.ordensServico.length} OS`} />
          <StatTile label="Liquidado" value={formatCurrency(obra.valorExecutado)} hint={`${executado}% do emitido`} />
          <StatTile
            label="A liquidar"
            value={balance.kind === "paid" || balance.kind === "concluded" ? "Sem saldo" : formatCurrency(balance.saldo)}
            valueTone={balance.kind === "paid" || balance.kind === "concluded" ? "success" : "default"}
            hint={balance.kind === "paid" ? "obra paga" : "nas OS ativas"}
          />
          <StatTile
            label="Prazo da obra"
            value={obra.dataPrevisaoTermino ? formatDateOnly(obra.dataPrevisaoTermino) : "Sem prazo"}
            hint={
              obra.dataConclusao
                ? `concluída em ${formatDate(obra.dataConclusao)}`
                : hint
                  ? hint.label.toLowerCase()
                  : obra.dataInicio
                    ? `início ${formatDateOnly(obra.dataInicio)}`
                    : "defina os prazos nas OS"
            }
            hintTone={obra.dataConclusao ? "success" : (hint?.tone ?? "muted")}
          />
        </StatTiles>
        <Bar percent={executado} className={executado > 100 ? "bg-danger-text" : "bg-primary-500"} />
        {balance.kind === "paid" && (
          <div className="flex items-center gap-2.5 rounded-lg border border-success-border bg-success-bg px-3.5 py-2.5 text-sm text-success-text">
            <CheckCircle2 size={16} className="shrink-0" />
            <p>
              <span className="font-semibold">Obra paga.</span> Nenhuma OS desta obra tem saldo a liquidar
              {canEditEngenharia ? ": já pode ser concluída." : "."}
            </p>
          </div>
        )}
      </section>

      <FormSection title="Ordens de serviço" icon={ClipboardList} count={obra.ordensServico.length}>
        {obra.ordensServico.length > 0 ? (
          <ul className="space-y-2.5">
            {obra.ordensServico.map((os) => (
              <OrdemServicoCard key={os.id} os={os} obra={obra} onOpen={linkTo("ordemServico", os.id)} />
            ))}
          </ul>
        ) : (
          <EmptyNote>Nenhuma ordem de serviço vinculada.</EmptyNote>
        )}
      </FormSection>

      <FormSection title="Vínculos" icon={Link2}>
        <RelationGrid>
          {contratos.map((contrato) => (
            <RelationCard
              key={contrato.id}
              icon={FileSignature}
              label="Contrato"
              title={contrato.identificador}
              color={contrato.cor}
              hint={contrato.descricaoCurta}
              onClick={linkTo("contrato", contrato.id)}
            />
          ))}
          {empresas.map((empresa) => (
            <RelationCard
              key={empresa.id}
              icon={Building2}
              label="Empresa"
              title={empresa.name}
              onClick={linkTo("empresa", empresa.id)}
            />
          ))}
        </RelationGrid>
      </FormSection>

      {canViewAdministrativo && (
        <FormSection title="Notas fiscais da obra" icon={FileText} count={notas.length}>
          {notas.length === 0 ? (
            <EmptyNote>Nenhuma nota fiscal lançada nesta obra.</EmptyNote>
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
              </Table>
            </div>
          )}
        </FormSection>
      )}

      <FormSection title="Dados da obra" icon={HardHat}>
        <DetailGrid>
          <DetailItem icon={UserCog} label="Responsável técnico">
            {obra.responsavelTecnico}
          </DetailItem>
          <DetailItem icon={Tag} label="Tipo">
            {OBRA_TIPO_LABEL[obra.tipo] ?? obra.tipo}
          </DetailItem>
          {obra.idPatrimonialCompleto && (
            <DetailItem icon={Hash} label="Identificação patrimonial completa">
              {obra.idPatrimonialCompleto}
            </DetailItem>
          )}
          {obra.apelido && (
            <DetailItem icon={Building2} label="Edificação">
              {obra.apelido}
            </DetailItem>
          )}
          {obra.areaConstruida != null && (
            <DetailItem icon={Ruler} label="Área construída">
              {String(obra.areaConstruida).replace(".", ",")} m²
            </DetailItem>
          )}
          {obra.estadoConservacao && (
            <DetailItem icon={Building2} label="Estado de conservação">
              {obra.estadoConservacao}
            </DetailItem>
          )}
          {obra.descricao && (
            <DetailItem icon={AlignLeft} label="Descrição" long className="sm:col-span-2 lg:col-span-3">
              {obra.descricao}
            </DetailItem>
          )}
          {obra.anotacoes && (
            <DetailItem icon={StickyNote} label="Anotações de campo" long className="sm:col-span-2 lg:col-span-3">
              {obra.anotacoes}
            </DetailItem>
          )}
        </DetailGrid>
      </FormSection>

      {hasCoordinates && (
        <FormSection title="Local da obra" icon={MapPinned}>
          <Suspense fallback={<div className="h-52 rounded-lg border border-border bg-surface-muted animate-pulse" />}>
            <ObraMiniMap
              latitude={obra.latitude!}
              longitude={obra.longitude!}
              color={obra.contrato?.cor ?? "#2a2b2e"}
              label={obra.identificacaoPatrimonial}
            />
          </Suspense>
        </FormSection>
      )}

      <CompleteObraDialog obra={obra} open={completing} onClose={() => setCompleting(false)} />
    </ViewFrame>
  );
}
