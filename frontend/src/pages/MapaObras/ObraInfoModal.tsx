import {
  HardHat,
  ClipboardList,
  UserCog,
  CalendarPlus,
  CalendarClock,
  CalendarCheck,
  MapPin,
  Tag,
  FileText,
} from "lucide-react";
import type { ObraDetail } from "../../../types/obra";
import { formatDate, formatDateOnly } from "../../utils/format-currency";
import { PanelModal, StatusPill } from "./obra-detail-shared";
import { OBRA_STATUS_LABEL, OBRA_TIPO_LABEL, RECORD_STATUS } from "./obra-detail-utils";

function Field({ icon: Icon, label, children }: { icon: typeof HardHat; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <Icon size={14} className="text-text-muted mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-text-muted leading-none">{label}</p>
        <div className="text-sm font-medium text-text-primary mt-1 wrap-break-word">{children}</div>
      </div>
    </div>
  );
}

interface ObraInfoModalProps {
  detail: ObraDetail;
  onClose: () => void;
}

export function ObraInfoModal({ detail, onClose }: ObraInfoModalProps) {
  const { obra, ordemServico } = detail;

  return (
    <PanelModal
      icon={<HardHat size={20} />}
      title={obra.nome}
      subtitle={`${obra.identificacaoPatrimonial} · ${OBRA_TIPO_LABEL[obra.tipo]} · ${OBRA_STATUS_LABEL[obra.status]}`}
      onClose={onClose}
    >
      <div className="space-y-5">
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <Field icon={ClipboardList} label="Ordem de serviço">
            <span className="inline-flex items-center gap-2">
              {ordemServico.numero}
              <StatusPill status={ordemServico.status} map={RECORD_STATUS} />
            </span>
          </Field>
          <Field icon={UserCog} label="Responsável técnico">
            {obra.responsavelTecnico}
          </Field>
          <Field icon={Tag} label="Tipo">
            {OBRA_TIPO_LABEL[obra.tipo]}
          </Field>
          <Field icon={MapPin} label="Coordenadas">
            {typeof obra.latitude === "number" && typeof obra.longitude === "number"
              ? `${obra.latitude.toFixed(6)}, ${obra.longitude.toFixed(6)}`
              : "Não informadas"}
          </Field>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="rounded-lg border border-border bg-surface-muted px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-xs text-text-muted">
              <CalendarPlus size={13} /> Início
            </p>
            <p className="text-sm font-semibold text-text-primary mt-1">{formatDateOnly(obra.dataInicio)}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface-muted px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-xs text-text-muted">
              <CalendarClock size={13} /> Previsão de término
            </p>
            <p className="text-sm font-semibold text-text-primary mt-1">{formatDateOnly(obra.dataPrevisaoTermino)}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface-muted px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-xs text-text-muted">
              <CalendarCheck size={13} /> Conclusão
            </p>
            <p className={`text-sm mt-1 ${obra.dataConclusao ? "font-semibold text-text-primary" : "text-text-muted"}`}>
              {obra.dataConclusao ? formatDate(obra.dataConclusao) : "—"}
            </p>
          </div>
        </section>

        <section>
          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary uppercase mb-2">
            <FileText size={13} /> Descrição
          </h3>
          <p className="text-sm text-text-primary whitespace-pre-line leading-relaxed">{obra.descricao}</p>
          {obra.anotacoes && (
            <div className="mt-3 bg-surface-muted rounded-lg px-3 py-2 text-xs text-text-secondary italic leading-relaxed">
              "{obra.anotacoes}"
            </div>
          )}
        </section>
      </div>
    </PanelModal>
  );
}
