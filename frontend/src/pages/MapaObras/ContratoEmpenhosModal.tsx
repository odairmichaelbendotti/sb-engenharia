import { FileSignature } from "lucide-react";
import type { ObraDetail, ObraDetailFinancial } from "../../../types/obra";
import { formatCurrency, formatDateOnly } from "../../utils/format-currency";
import { Badge } from "../../components/ui";
import { PanelModal, ProgressBar, StatusPill } from "./obra-detail-shared";
import { formatPercent, percentOf, RECORD_STATUS } from "./obra-detail-utils";

interface ContratoEmpenhosModalProps {
  contrato: ObraDetail["contrato"];
  financial: ObraDetailFinancial["contrato"];
  // Empenhos que financiam a OS desta obra (destacados na tabela)
  currentEmpenhoIds: string[];
  onClose: () => void;
}

function Summary({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-muted/60 px-3 py-2.5 min-w-0">
      <p className="text-[11px] text-text-muted">{label}</p>
      <p className={`text-sm font-semibold truncate ${tone ?? "text-text-primary"}`}>{value}</p>
      {hint && <p className="text-[11px] text-text-secondary mt-0.5">{hint}</p>}
    </div>
  );
}

export function ContratoEmpenhosModal({ contrato, financial, currentEmpenhoIds, onClose }: ContratoEmpenhosModalProps) {
  const empenhadoPercent = percentOf(financial.totalEmpenhado, financial.valor);
  const utilizadoPercent = percentOf(financial.totalLiquidado, financial.valor);
  const saldoAEmpenhar = financial.valor - financial.totalEmpenhado;

  return (
    <PanelModal
      icon={FileSignature}
      title={`Empenhos do contrato ${contrato.identificador}`}
      subtitle={
        <>
          {contrato.company.name} · vigência {formatDateOnly(contrato.dataInicio)} a {formatDateOnly(contrato.dataFim)}
        </>
      }
      onClose={onClose}
      size="xl"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <Summary label="Valor do contrato" value={formatCurrency(financial.valor)} />
        <Summary
          label="Empenhado"
          value={formatCurrency(financial.totalEmpenhado)}
          hint={`${formatPercent(empenhadoPercent)} do contrato`}
        />
        <Summary
          label="Utilizado (NFs)"
          value={formatCurrency(financial.totalLiquidado)}
          hint={`${formatPercent(utilizadoPercent)} do contrato`}
          tone="text-success-text"
        />
        <Summary
          label="Saldo a empenhar"
          value={formatCurrency(saldoAEmpenhar)}
          tone={saldoAEmpenhar < 0 ? "text-danger-text" : "text-accent-600"}
        />
      </div>

      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-table min-w-[620px]">
          <thead>
            <tr className="text-xs text-text-secondary uppercase tracking-wide border-b border-border">
              <th className="text-left font-semibold py-2.5 px-2">Empenho</th>
              <th className="text-left font-semibold py-2.5 px-2">Vigência</th>
              <th className="text-right font-semibold py-2.5 px-2">Valor</th>
              <th className="text-right font-semibold py-2.5 px-2">Liquidado</th>
              <th className="text-left font-semibold py-2.5 px-2 w-28">% liquidado</th>
              <th className="text-center font-semibold py-2.5 px-2">OS</th>
              <th className="text-left font-semibold py-2.5 px-2">Situação</th>
            </tr>
          </thead>
          <tbody>
            {financial.empenhos.map((empenho) => {
              const isCurrent = currentEmpenhoIds.includes(empenho.id);
              const liquidadoPercent = percentOf(empenho.liquidado, empenho.value);
              return (
                <tr
                  key={empenho.id}
                  className={`border-b border-border/60 ${isCurrent ? "bg-surface-muted/60" : ""} ${
                    empenho.status === "CANCELADO" ? "opacity-60" : ""
                  }`}
                >
                  <td className="py-3 px-2">
                    <p className="font-semibold text-text-primary flex items-center gap-1.5">
                      {empenho.numero}
                      {isCurrent && <Badge>desta obra</Badge>}
                    </p>
                    <p className="text-[11px] text-text-muted truncate max-w-[200px]" title={empenho.description}>
                      {empenho.description}
                    </p>
                  </td>
                  <td className="py-3 px-2 text-xs text-text-secondary whitespace-nowrap">
                    {formatDateOnly(empenho.startAt)} → {formatDateOnly(empenho.endAt)}
                  </td>
                  <td className="py-3 px-2 text-right font-medium text-text-primary whitespace-nowrap">
                    {formatCurrency(empenho.value)}
                  </td>
                  <td className="py-3 px-2 text-right text-success-text whitespace-nowrap">
                    {formatCurrency(empenho.liquidado)}
                  </td>
                  <td className="py-3 px-2">
                    <ProgressBar percent={liquidadoPercent} colorClassName="bg-secondary-500" />
                    <p className="text-[10px] text-text-muted mt-0.5">{formatPercent(liquidadoPercent)}</p>
                  </td>
                  <td className="py-3 px-2 text-center text-text-secondary">{empenho.ordensServicoCount}</td>
                  <td className="py-3 px-2">
                    <StatusPill status={empenho.status} map={RECORD_STATUS} />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="font-semibold text-text-primary">
              <td colSpan={2} className="py-3 px-2">
                Total empenhado
                <span className="block text-[10.5px] font-normal text-text-muted">sem empenhos cancelados</span>
              </td>
              <td className="py-3 px-2 text-right whitespace-nowrap">{formatCurrency(financial.totalEmpenhado)}</td>
              <td className="py-3 px-2 text-right text-success-text whitespace-nowrap">
                {formatCurrency(financial.totalLiquidado)}
              </td>
              <td colSpan={3} className="py-3 px-2 text-xs font-medium text-text-secondary">
                {formatPercent(percentOf(financial.totalLiquidado, financial.totalEmpenhado))} do empenhado
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </PanelModal>
  );
}
