import { FileText, DollarSign, CheckCircle2, Clock } from "lucide-react";
import { StatCard } from "../../components/StatCard";
import type { InvoiceDashboard } from "./types";

interface StatusCardsProps {
  dashboard: InvoiceDashboard | null;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function StatusCards({ dashboard }: StatusCardsProps) {
  const metrics = dashboard || {
    totalCount: 0,
    totalValue: 0,
    paidInvoices: 0,
    paidValue: 0,
    expiredCount: 0,
    expiredValue: 0,
    pendingInvoices: 0,
    pendingValue: 0,
    allInvoices: [],
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Total de NFs"
        value={metrics.totalCount.toString()}
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
        value={metrics.paidInvoices.toString()}
        subtitle={formatCurrency(metrics.paidValue)}
        icon={<CheckCircle2 size={24} className="text-success-text" />}
        color="bg-success-bg"
      />
      <StatCard
        title="Pendentes/Vencidas"
        value={(metrics.pendingInvoices + metrics.expiredCount).toString()}
        subtitle={formatCurrency(metrics.pendingValue + metrics.expiredValue)}
        icon={<Clock size={24} className="text-warning-text" />}
        color="bg-warning-bg"
      />
    </div>
  );
}
