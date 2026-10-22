import {
  Calendar,
  Banknote,
  FileText,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { Empenho } from "../../../types/empenho";
import { formatCurrency, formatDate } from "../../utils/format-currency";
import { parseCurrencyMask } from "../../utils/masks";
import { Badge } from "../../components/ui";

type InfoTileKey = "total" | "paid" | "remaining" | "current";

const INFO_TILES: { key: InfoTileKey; label: string; icon: LucideIcon }[] = [
  { key: "total", label: "Valor Total", icon: Banknote },
  { key: "paid", label: "Liquidado", icon: CheckCircle2 },
  { key: "remaining", label: "Saldo", icon: TrendingUp },
  { key: "current", label: "Esta NF", icon: Banknote },
];

interface EmpenhoDetailsProps {
  empenho: Empenho | null;
  newValue: string;
}

export function EmpenhoDetails({ empenho, newValue }: EmpenhoDetailsProps) {
  if (!empenho) return null;

  const totalPaid = empenho.totalPaid || 0;
  const totalValue = empenho.value || 0;
  const newValueNum = parseCurrencyMask(newValue);
  const totalAfterPayment = totalPaid + newValueNum;
  const exceedsLimit = totalAfterPayment > totalValue;

  // Cálculos das barras de progresso
  const paidPercentage = totalValue > 0 ? (totalPaid / totalValue) * 100 : 0;
  const totalPercentage =
    totalValue > 0 ? (totalAfterPayment / totalValue) * 100 : 0;
  const remainingValue = totalValue - totalPaid;

  // Valores dos quadros de resumo, na ordem de INFO_TILES
  const tileValues: Record<InfoTileKey, number> = {
    total: totalValue,
    paid: totalPaid,
    remaining: Math.max(0, remainingValue),
    current: newValueNum,
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 ease-out">
      {/* Card Principal */}
      <div className="bg-surface rounded-xl border border-border p-5">
        {/* Header com Numero e Status */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} className="text-text-muted" />
              <h3 className="text-base font-semibold text-text-primary">
                {empenho.numero}
              </h3>
            </div>
            <p className="text-sm text-text-secondary">{empenho.description}</p>
          </div>
          <Badge tone={empenho.status === "ativo" ? "success" : "neutral"}>
            {empenho.status}
          </Badge>
        </div>

        {/* Grid de Informações */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {INFO_TILES.map(({ key, label, icon: Icon }) => (
            <div key={key} className="bg-surface-muted rounded-lg p-3 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className="text-text-muted" />
                <span className="text-xs text-text-secondary font-medium">
                  {label}
                </span>
              </div>
              <p className="text-sm font-semibold text-text-primary tabular-nums">
                {formatCurrency(tileValues[key])}
              </p>
            </div>
          ))}
        </div>

        {/* Datas */}
        <div className="flex gap-3 mb-4 text-xs">
          <div className="flex items-center gap-2 text-text-secondary">
            <Calendar size={14} className="text-text-muted" />
            <span className="font-medium">Início:</span>
            <span className="text-text-primary">
              {formatDate(empenho.startAt)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Calendar size={14} className="text-text-muted" />
            <span className="font-medium">Fim:</span>
            <span className="text-text-primary">{formatDate(empenho.endAt)}</span>
          </div>
        </div>

        {/* Barra de Progresso - Liquidação Atual */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-secondary">
              Progresso de Liquidação
            </span>
            <span className="text-xs font-semibold text-text-primary tabular-nums">
              {Math.min(100, Math.round(paidPercentage))}%
            </span>
          </div>
          <div className="w-full bg-surface-muted border border-border rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-secondary-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, paidPercentage)}%` }}
            />
          </div>
        </div>

        {/* Barra de Progresso - Com Nova NF */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-secondary">
                Total com Esta NF
              </span>
              {exceedsLimit && (
                <AlertCircle size={14} className="text-danger-text" />
              )}
            </div>
            <span
              className={`text-xs font-semibold tabular-nums ${exceedsLimit ? "text-danger-text" : "text-text-primary"}`}
            >
              {Math.round(Math.min(150, totalPercentage))}%
            </span>
          </div>
          <div className="w-full bg-surface-muted border border-border rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                exceedsLimit ? "bg-danger-text" : "bg-primary-400"
              }`}
              style={{ width: `${Math.min(100, totalPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Aviso de Erro - Se Exceder Limite */}
      {exceedsLimit && (
        <div className="bg-danger-bg border border-danger-border rounded-lg p-4 flex gap-3">
          <AlertCircle size={16} className="text-danger-text shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-danger-text mb-1">
              Atenção: Limite do Empenho Será Ultrapassado
            </p>
            <p className="text-sm text-danger-text">
              O valor desta nota fiscal ({formatCurrency(newValueNum)}) somado
              ao já liquidado ({formatCurrency(totalPaid)}) ultrapassa o limite
              do empenho ({formatCurrency(totalValue)}) em{" "}
              <span className="font-semibold">
                {formatCurrency(totalAfterPayment - totalValue)}
              </span>
              .
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
