import { CheckCircle2 } from "lucide-react";
import { formatCurrency } from "../../utils/format-currency";
import { cx } from "../../utils/cx";
import { percent, type Ritmo } from "./medicao-progress";

const RITMO_TEXT = {
  neutral: "text-text-muted",
  warning: "text-warning-text font-semibold",
  danger: "text-danger-text font-semibold",
} as const;

interface MedidoCellProps {
  valorOrcado: number;
  // Só medições fechadas
  valorMedido: number;
  // Valor do rascunho aberto (fica mais claro na barra)
  valorRascunho: number;
  // Comparação com o prazo decorrido; null sem cronograma ou com a OS encerrada
  ritmo: Ritmo | null;
}

/**
 * Quanto do orçamento já foi medido: percentual, barra (medido em verde, rascunho mais claro),
 * "R$ X de R$ Y" e o ritmo frente ao prazo. Medido até o fim fica verde.
 */
export function MedidoCell({ valorOrcado, valorMedido, valorRascunho, ritmo }: MedidoCellProps) {
  if (valorOrcado <= 0) return <span className="text-text-muted">—</span>;

  const medido = Math.min(1, valorMedido / valorOrcado);
  const rascunho = Math.min(1 - medido, valorRascunho / valorOrcado);
  const completo = valorMedido >= valorOrcado;

  return (
    <span className="inline-flex flex-col items-end w-40 max-w-full">
      <span
        className={cx(
          "inline-flex items-center gap-1 font-semibold tabular-nums",
          completo ? "text-success-text" : "text-text-primary",
        )}
      >
        {completo && <CheckCircle2 size={13} />}
        {completo ? "Medido" : `${percent(medido)}% medido`}
      </span>
      <span className="mt-1 h-1.5 w-full rounded-full bg-surface-muted overflow-hidden flex" aria-hidden>
        <span className="h-full bg-secondary-500" style={{ width: `${medido * 100}%` }} />
        {rascunho > 0 && <span className="h-full bg-secondary-500/35" style={{ width: `${rascunho * 100}%` }} />}
      </span>
      <span className="mt-0.5 text-[11px] text-text-muted tabular-nums truncate max-w-full">
        {formatCurrency(valorMedido)} de {formatCurrency(valorOrcado)}
      </span>
      {ritmo && !completo && (
        <span className={cx("text-[11px] tabular-nums", RITMO_TEXT[ritmo.tone])} title={ritmo.title}>
          {ritmo.label}
        </span>
      )}
    </span>
  );
}
