import { CheckCircle2 } from "lucide-react";
import type { Contrato } from "../../../types/contrato";
import { formatCurrency } from "../../utils/format-currency";

/**
 * Saldo do contrato = valor − notas fiscais emitidas (liquidado).
 * Sem cor de alerta: saldo baixo ou zerado é o andamento normal do contrato.
 * Só destaca quando o liquidado alcança o valor total — contrato liquidado.
 */
export function ContratoSaldo({ contrato }: { contrato: Pick<Contrato, "valor" | "valorLiquidado" | "saldoALiquidar"> }) {
  const percent = contrato.valor > 0 ? Math.min(100, (contrato.valorLiquidado / contrato.valor) * 100) : 0;
  const isLiquidado = contrato.valor > 0 && contrato.valorLiquidado >= contrato.valor;

  if (isLiquidado) {
    return (
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium bg-success-bg text-success-text border-success-border">
          <CheckCircle2 size={12} />
          Contrato liquidado
        </span>
        <p className="text-xs text-text-secondary">
          Pago <span className="font-semibold text-text-primary">{formatCurrency(contrato.valorLiquidado)}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1" title="Valor do contrato menos as notas fiscais emitidas">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-text-primary">{formatCurrency(contrato.saldoALiquidar)}</span>
        <span className="text-text-muted shrink-0">de {formatCurrency(contrato.valor)}</span>
      </div>
      <div className="h-1.5 bg-surface-muted border border-border rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-text-muted transition-all" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-[11px] text-text-muted">
        Liquidado {formatCurrency(contrato.valorLiquidado)} ({percent.toFixed(0)}%)
      </p>
    </div>
  );
}
