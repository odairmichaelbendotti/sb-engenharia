import { CheckCircle2 } from "lucide-react";
import { formatCurrency } from "../utils/format-currency";

interface SaldoLiquidacaoProps {
  valor: number;
  liquidado: number;
  saldo: number;
  // Rótulo do selo quando tudo foi pago (ex.: "Contrato liquidado")
  liquidadoLabel: string;
}

/**
 * Saldo = valor − notas fiscais emitidas (liquidado), usado em Contratos e Empenhos.
 * Sem cor de alerta: saldo baixo ou zerado é o andamento normal da execução.
 * Só destaca, em verde, quando o liquidado alcança o valor total.
 */
export function SaldoLiquidacao({ valor, liquidado, saldo, liquidadoLabel }: SaldoLiquidacaoProps) {
  const percent = valor > 0 ? Math.min(100, (liquidado / valor) * 100) : 0;
  const isLiquidado = valor > 0 && liquidado >= valor;

  if (isLiquidado) {
    return (
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium bg-success-bg text-success-text border-success-border">
          <CheckCircle2 size={12} />
          {liquidadoLabel}
        </span>
        <p className="text-xs text-text-secondary">
          Pago <span className="font-semibold text-text-primary">{formatCurrency(liquidado)}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1" title="Valor total menos as notas fiscais emitidas">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-text-primary">{formatCurrency(saldo)}</span>
        <span className="text-text-muted shrink-0">de {formatCurrency(valor)}</span>
      </div>
      <div className="h-1.5 bg-surface-muted border border-border rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-text-muted transition-all" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-[11px] text-text-muted">
        Liquidado {formatCurrency(liquidado)} ({percent.toFixed(0)}%)
      </p>
    </div>
  );
}
