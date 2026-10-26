import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "../utils/format-currency";
import { cx } from "../utils/cx";
import { getBalance } from "../pages/OrdemServico/ordem-servico-balance";

interface BalanceCellProps {
  // Valor total (contrato, empenho, OS, obra) e quanto já foi liquidado em notas fiscais
  valor: number;
  liquidado: number;
  // Rótulo quando tudo foi pago ("Quitada", "Empenho liquidado", "Obra paga")
  paidLabel?: string;
  // Linha extra no estado pago (ex.: "concluída em 12/08")
  paidHint?: string;
  // Registro encerrado (cancelado): só o valor, sem barra nem destaque
  inactive?: boolean;
}

/**
 * Saldo a liquidar, igual em todas as tabelas: rótulo, valor, barra e "N% de R$ X".
 * Pago fica verde; liquidado acima do valor fica vermelho; sem nota, mostra o valor cheio.
 * Alinha à direita (é a última coluna de dado da linha).
 */
export function BalanceCell({ valor, liquidado, paidLabel = "Quitada", paidHint, inactive = false }: BalanceCellProps) {
  const balance = getBalance(valor, liquidado);

  if (inactive) {
    return (
      <span className="inline-flex flex-col items-end">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Valor</span>
        <span className="font-semibold text-text-secondary tabular-nums">{formatCurrency(valor)}</span>
      </span>
    );
  }

  const label = balance.kind === "paid" || balance.kind === "over" ? "Saldo" : "A liquidar";
  const fill =
    balance.kind === "over" ? "bg-danger-dot" : balance.kind === "paid" ? "bg-success-dot" : "bg-progress";
  const hint =
    balance.kind === "empty"
      ? "nenhuma nota lançada"
      : balance.kind === "paid"
        ? (paidHint ?? `${formatCurrency(liquidado)} liquidados`)
        : `${balance.percent}% de ${formatCurrency(valor)}`;

  return (
    <span
      className="inline-flex flex-col items-end gap-0.5 w-40 max-w-full"
      title={`${formatCurrency(liquidado)} liquidados de ${formatCurrency(valor)}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">{label}</span>
      {balance.kind === "paid" ? (
        <span className="inline-flex items-center gap-1 font-semibold text-success-text">
          <CheckCircle2 size={13} />
          {paidLabel}
        </span>
      ) : balance.kind === "over" ? (
        <span className="inline-flex items-center gap-1 font-semibold text-danger-text tabular-nums">
          <AlertTriangle size={13} />
          {formatCurrency(balance.excesso)} acima
        </span>
      ) : (
        <span className="font-semibold text-text-primary tabular-nums">{formatCurrency(balance.kind === "empty" ? valor : balance.saldo)}</span>
      )}
      <span className="w-full h-1.25 rounded-full bg-progress-track overflow-hidden" aria-hidden>
        <span className={cx("block h-full rounded-full", fill)} style={{ width: `${Math.min(100, balance.percent)}%` }} />
      </span>
      <span className="text-[11px] text-text-muted tabular-nums truncate max-w-full">{hint}</span>
    </span>
  );
}
