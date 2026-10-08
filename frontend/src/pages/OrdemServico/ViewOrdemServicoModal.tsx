import { lazy, Suspense, useEffect } from "react";
import {
  X,
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
} from "lucide-react";
import type { OrdemServico, OrdemServicoObra } from "../../../types/ordem-servico";
import { formatCurrency, formatDate, formatDateOnly } from "../../utils/format-currency";
import { usePermission } from "../../hooks/usePermission";
import { OrdemServicoNumeroTag } from "../../components/OrdemServicoNumeroTag";
import { getBalance, getOrdemServicoBalance } from "./ordem-servico-balance";
import { FinalizeOrdemServicoCallout } from "./FinalizeOrdemServico";

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

interface ViewOrdemServicoModalProps {
  ordemServico: OrdemServico;
  handleClose: () => void;
}

const STATUS_LABEL: Record<OrdemServico["status"], string> = {
  ATIVO: "Ativa",
  FINALIZADO: "Finalizada",
  CANCELADO: "Cancelada",
};

const STATUS_CLASS: Record<OrdemServico["status"], string> = {
  ATIVO: "bg-warning-bg text-warning-text border-warning-border",
  FINALIZADO: "bg-success-bg text-success-text border-success-border",
  CANCELADO: "bg-danger-bg text-danger-text border-danger-border",
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

function Field({
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
        done ? "border-primary-200 bg-primary-50/50" : "border-border bg-surface-muted"
      }`}
    >
      <div className="flex items-center gap-1.5 text-xs text-text-muted">
        <Icon size={13} className={done ? "text-primary-500" : "text-text-muted"} />
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
        <Field icon={HardHat} label="Obra">
          {obra.nome}
        </Field>
        <Field icon={ClipboardList} label="Identificação patrimonial">
          {obra.identificacaoPatrimonial}
        </Field>
        <Field icon={HardHat} label="Tipo / Situação">
          {OBRA_TIPO_LABEL[obra.tipo] ?? obra.tipo} · {OBRA_STATUS_LABEL[obra.status] ?? obra.status}
        </Field>
        <Field icon={UserCog} label="Responsável técnico">
          {obra.responsavelTecnico}
        </Field>
      </div>
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
          <p className="text-xs font-semibold text-text-secondary uppercase">
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
  const totals = ordemServico.empenhos.reduce(
    (acc, v) => ({ valor: acc.valor + v.valor, liquidado: acc.liquidado + v.liquidado }),
    { valor: 0, liquidado: 0 },
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-120">
        <thead>
          <tr className="text-[11px] uppercase text-text-muted border-b border-border">
            <th className="text-left font-semibold pb-2">Empenho</th>
            <th className="text-right font-semibold pb-2">Destinado à OS</th>
            <th className="text-right font-semibold pb-2">Liquidado</th>
            <th className="text-right font-semibold pb-2">A liquidar</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {ordemServico.empenhos.map((v) => {
            const saldo = getBalance(v.valor, v.liquidado);
            const livre = Math.max(0, v.empenhoValue - v.empenhoComprometido);
            return (
              <tr key={v.empenho_id} className="border-b border-border align-top">
                <td className="py-2.5 pr-3">
                  <span className="font-mono text-[13px] text-text-primary">{v.numero}</span>
                  <span className="block text-xs text-text-muted mt-0.5">
                    Empenho de {formatCurrency(v.empenhoValue)} ·{" "}
                    {livre > 0 ? `${formatCurrency(livre)} livres para novas OS` : "sem saldo livre"}
                  </span>
                </td>
                <td className="py-2.5 text-right">{formatCurrency(v.valor)}</td>
                <td className="py-2.5 text-right">{formatCurrency(v.liquidado)}</td>
                <td
                  className={`py-2.5 text-right font-semibold ${
                    saldo.kind === "over" ? "text-danger-text" : saldo.saldo === 0 ? "text-success-text" : "text-primary-600"
                  }`}
                >
                  {saldo.kind === "over" ? `+${formatCurrency(saldo.excesso)}` : formatCurrency(saldo.saldo)}
                </td>
              </tr>
            );
          })}
        </tbody>
        {ordemServico.empenhos.length > 1 && (
          <tfoot className="tabular-nums font-semibold text-text-primary">
            <tr>
              <td className="pt-2.5">Total</td>
              <td className="pt-2.5 text-right">{formatCurrency(totals.valor)}</td>
              <td className="pt-2.5 text-right">{formatCurrency(totals.liquidado)}</td>
              <td className="pt-2.5 text-right">{formatCurrency(Math.max(0, totals.valor - totals.liquidado))}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export function ViewOrdemServicoModal({ ordemServico, handleClose }: ViewOrdemServicoModalProps) {
  const { obra, empenho } = ordemServico;
  const { contrato } = empenho;
  const { canEditAdministrativo } = usePermission();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-border">
        <div className="relative flex items-start justify-between gap-3 pl-6 pr-4 py-4 border-b border-border shrink-0">
          {/* Faixa na cor do contrato, igual à da linha da lista */}
          <span aria-hidden className="absolute left-0 inset-y-0 w-1.5 rounded-tl-2xl" style={{ backgroundColor: contrato.cor }} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary">
              <OrdemServicoNumeroTag numero={ordemServico.numero} />
              <span className={`px-2 py-px rounded-full text-[11px] font-medium border ${STATUS_CLASS[ordemServico.status]}`}>
                {STATUS_LABEL[ordemServico.status]}
              </span>
              <span>
                {contrato.company.name} <span className="text-text-muted">·</span> {contrato.identificador}
              </span>
            </div>
            <h2 className={`text-lg font-semibold mt-1.5 leading-snug ${obra ? "text-text-primary" : "text-text-secondary"}`}>
              {obra?.nome ?? empenho.description}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-surface-muted rounded-lg transition-colors cursor-pointer shrink-0"
            title="Fechar"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          <section>
            <BalanceSection ordemServico={ordemServico} canFinalize={canEditAdministrativo} />
          </section>

          <section>
            <h3 className="text-xs font-semibold text-text-secondary uppercase mb-2">
              {ordemServico.empenhos.length > 1 ? "Empenhos" : "Empenho"}
            </h3>
            <EmpenhosTable ordemServico={ordemServico} />
          </section>

          <section>
            <h3 className="text-xs font-semibold text-text-secondary uppercase mb-1">Cronograma</h3>
            <p className="text-xs text-text-muted mb-2.5">
              {ordemServico.dataInicio
                ? "Prazos de execução desta ordem de serviço."
                : "Esta ordem de serviço ainda não tem prazo: edite-a e informe o início e a previsão de término."}
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <DateStep
                icon={CalendarPlus}
                label="Emissão da OS"
                value={formatDate(ordemServico.createdAt)}
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
          </section>

          <section>
            <h3 className="text-xs font-semibold text-text-secondary uppercase mb-2.5">
              Obra vinculada
            </h3>
            {obra ? (
              <ObraSection ordemServico={ordemServico} obra={obra} />
            ) : (
              <div className="flex items-start gap-2.5 rounded-lg border border-warning-border bg-warning-bg px-3.5 py-3">
                <AlertTriangle size={16} className="text-warning-text shrink-0 mt-0.5" />
                <p className="text-sm text-warning-text">
                  Nenhuma obra vinculada. Edite esta ordem de serviço e escolha a obra, ou vincule-a pelo
                  cadastro da obra em Engenharia &gt; Obras.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
