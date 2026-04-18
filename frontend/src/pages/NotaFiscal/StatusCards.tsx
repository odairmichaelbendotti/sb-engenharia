import { useMemo } from "react";
import { FileText, DollarSign, CheckCircle2, Clock } from "lucide-react";
import { StatCard } from "../../components/StatCard";
import type { NotaFiscal } from "../../../types/notaFiscal";

interface StatusCardsProps {
  invoices: NotaFiscal[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function StatusCards({ invoices }: StatusCardsProps) {
  const metrics = useMemo(() => {
    const paid = invoices.filter((inv) => inv.status === "paid");
    const pending = invoices.filter((inv) => inv.status === "pending");
    const overdue = invoices.filter((inv) => inv.status === "overdue");

    return {
      total: invoices.length,
      totalValue: invoices.reduce((sum, inv) => sum + inv.value, 0),
      paidCount: paid.length,
      paidValue: paid.reduce((sum, inv) => sum + inv.value, 0),
      pendingCount: pending.length,
      pendingValue: pending.reduce((sum, inv) => sum + inv.value, 0),
      overdueCount: overdue.length,
      overdueValue: overdue.reduce((sum, inv) => sum + inv.value, 0),
    };
  }, [invoices]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Total de NFs"
        value={metrics.total.toString()}
        subtitle="Emitidas"
        icon={<FileText size={24} className="text-primary-500" />}
        color="bg-primary-100"
      />
      <StatCard
        title="Valor Total"
        value={formatCurrency(metrics.totalValue)}
        subtitle="Soma de todas"
        icon={<DollarSign size={24} className="text-accent-500" />}
        color="bg-accent-100"
      />
      <StatCard
        title="Pagas"
        value={metrics.paidCount.toString()}
        subtitle={formatCurrency(metrics.paidValue)}
        icon={<CheckCircle2 size={24} className="text-success-text" />}
        color="bg-success-bg"
      />
      <StatCard
        title="Pendentes/Vencidas"
        value={(metrics.pendingCount + metrics.overdueCount).toString()}
        subtitle={formatCurrency(metrics.pendingValue + metrics.overdueValue)}
        icon={<Clock size={24} className="text-warning-text" />}
        color="bg-warning-bg"
      />
    </div>
  );
}
