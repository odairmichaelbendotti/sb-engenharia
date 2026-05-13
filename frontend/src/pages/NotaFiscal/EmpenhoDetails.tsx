import {
  Calendar,
  Banknote,
  FileText,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import type { Empenho } from "../../../types/empenho";

interface EmpenhoDetailsProps {
  empenho: Empenho | null;
  newValue: string;
}

export function EmpenhoDetails({ empenho, newValue }: EmpenhoDetailsProps) {
  if (!empenho) return null;

  const totalPaid = empenho.totalPaid || 0;
  const totalValue = empenho.value || 0;
  const newValueNum = Number(newValue) || 0;
  const totalAfterPayment = totalPaid + newValueNum;
  const exceedsLimit = totalAfterPayment > totalValue;

  // Cálculos das barras de progresso
  const paidPercentage = totalValue > 0 ? (totalPaid / totalValue) * 100 : 0;
  const totalPercentage =
    totalValue > 0 ? (totalAfterPayment / totalValue) * 100 : 0;
  const remainingValue = totalValue - totalPaid;

  // Formatação de valores
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  // Definir cores baseado no status
  const statusColor =
    empenho.status === "ativo"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-slate-100 text-slate-700";
  const statusBgDot =
    empenho.status === "ativo" ? "bg-emerald-500" : "bg-slate-500";

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 ease-out">
      {/* Card Principal */}
      <div className="bg-linear-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100 p-5 shadow-sm">
        {/* Header com Numero e Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={18} className="text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">
                {empenho.numero}
              </h3>
            </div>
            <p className="text-sm text-slate-600">{empenho.description}</p>
          </div>
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusColor} whitespace-nowrap`}
          >
            <div className={`w-2 h-2 rounded-full ${statusBgDot}`} />
            <span className="text-xs font-medium">{empenho.status}</span>
          </div>
        </div>

        {/* Grid de Informações */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {/* Valor Total */}
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Banknote size={16} className="text-blue-600" />
              <span className="text-xs text-slate-600 font-medium">
                Valor Total
              </span>
            </div>
            <p className="text-sm font-bold text-slate-900">
              {formatCurrency(totalValue)}
            </p>
          </div>

          {/* Já Liquidado */}
          <div className="bg-white rounded-lg p-3 border border-emerald-100">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span className="text-xs text-slate-600 font-medium">
                Liquidado
              </span>
            </div>
            <p className="text-sm font-bold text-slate-900">
              {formatCurrency(totalPaid)}
            </p>
          </div>

          {/* Saldo Restante */}
          <div className="bg-white rounded-lg p-3 border border-amber-100">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-amber-600" />
              <span className="text-xs text-slate-600 font-medium">Saldo</span>
            </div>
            <p className="text-sm font-bold text-slate-900">
              {formatCurrency(Math.max(0, remainingValue))}
            </p>
          </div>

          {/* Esta NF */}
          <div className="bg-white rounded-lg p-3 border border-violet-100">
            <div className="flex items-center gap-2 mb-1">
              <Banknote size={16} className="text-violet-600" />
              <span className="text-xs text-slate-600 font-medium">
                Esta NF
              </span>
            </div>
            <p className="text-sm font-bold text-slate-900">
              {formatCurrency(newValueNum)}
            </p>
          </div>
        </div>

        {/* Datas */}
        <div className="flex gap-3 mb-4 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar size={14} className="text-slate-500" />
            <span className="font-medium">Início:</span>
            <span className="text-slate-700">
              {formatDate(empenho.startAt)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar size={14} className="text-slate-500" />
            <span className="font-medium">Fim:</span>
            <span className="text-slate-700">{formatDate(empenho.endAt)}</span>
          </div>
        </div>

        {/* Barra de Progresso - Liquidação Atual */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">
              Progresso de Liquidação
            </span>
            <span className="text-xs font-bold text-slate-900">
              {Math.min(100, Math.round(paidPercentage))}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-linear-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, paidPercentage)}%` }}
            />
          </div>
        </div>

        {/* Barra de Progresso - Com Nova NF */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Total com Esta NF
              </span>
              {exceedsLimit && (
                <AlertCircle size={14} className="text-red-500" />
              )}
            </div>
            <span
              className={`text-xs font-bold ${exceedsLimit ? "text-red-600" : "text-slate-900"}`}
            >
              {Math.round(Math.min(150, totalPercentage))}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                exceedsLimit
                  ? "bg-linear-to-r from-red-400 to-red-500"
                  : "bg-linear-to-r from-violet-400 to-violet-500"
              }`}
              style={{ width: `${Math.min(100, totalPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Aviso de Erro - Se Exceder Limite */}
      {exceedsLimit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900 mb-1">
              Atenção: Limite do Empenho Será Ultrapassado
            </p>
            <p className="text-sm text-red-700">
              O valor desta nota fiscal ({formatCurrency(newValueNum)}) somado
              ao já liquidado ({formatCurrency(totalPaid)}) ultrapassa o limite
              do empenho ({formatCurrency(totalValue)}) em{" "}
              <span className="font-bold">
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
