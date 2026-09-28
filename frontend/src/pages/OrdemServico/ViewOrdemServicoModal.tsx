import { lazy, Suspense, useEffect } from "react";
import {
  X,
  ClipboardList,
  FileSignature,
  Building2,
  HardHat,
  AlertTriangle,
  CalendarPlus,
  CalendarClock,
  CalendarCheck,
  Flag,
  UserCog,
  Wallet,
  MapPinOff,
} from "lucide-react";
import type { OrdemServico, OrdemServicoObra } from "../../../types/ordem-servico";
import { formatCurrency, formatDate, formatDateOnly } from "../../utils/format-currency";

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
  const executedPercent =
    ordemServico.valor > 0 ? Math.round((obra.valorExecutado / ordemServico.valor) * 100) : 0;

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
        <div className="sm:col-span-2">
          <Field icon={Wallet} label="Executado em obra">
            {formatCurrency(obra.valorExecutado)} de {formatCurrency(ordemServico.valor)} ({executedPercent}
            %)
          </Field>
        </div>
      </div>
    </div>
  );
}

export function ViewOrdemServicoModal({ ordemServico, handleClose }: ViewOrdemServicoModalProps) {
  const { obra, empenho } = ordemServico;

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
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-linear-to-r from-primary-50/50 to-transparent shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
              <ClipboardList size={20} className="text-primary-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-text-primary truncate">
                Ordem de Serviço {ordemServico.numero}
              </h2>
              <span
                className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_CLASS[ordemServico.status]}`}
              >
                {STATUS_LABEL[ordemServico.status]}
              </span>
            </div>
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
            <h3 className="text-xs font-semibold text-text-secondary uppercase mb-2.5">
              Ordem de serviço
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <Field icon={Wallet} label="Valor">
                {formatCurrency(ordemServico.valor)}
              </Field>
              <Field icon={FileSignature} label="Empenho">
                {empenho.numero}
              </Field>
              <Field icon={FileSignature} label="Contrato">
                {empenho.contrato.identificador}
              </Field>
              <Field icon={Building2} label="Empresa">
                {empenho.contrato.company.name}
              </Field>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-text-secondary uppercase mb-1">Cronograma</h3>
            <p className="text-xs text-text-muted mb-2.5">
              {obra
                ? "Os prazos desta ordem de serviço são os da obra vinculada."
                : "Os prazos de início e término passam a valer quando uma obra for vinculada a esta ordem de serviço."}
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
                label="Início da obra"
                value={obra ? formatDateOnly(obra.dataInicio) : null}
                done={!!obra}
              />
              <DateStep
                icon={Flag}
                label="Previsão de término"
                value={obra ? formatDateOnly(obra.dataPrevisaoTermino) : null}
                done={!!obra}
              />
              <DateStep
                icon={CalendarCheck}
                label="Conclusão"
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
                  Nenhuma obra vinculada. Crie uma obra em Engenharia &gt; Obras e selecione esta ordem de
                  serviço.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
