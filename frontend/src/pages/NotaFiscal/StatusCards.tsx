import { CheckCircle2, Clock, FileText, XCircle } from "lucide-react";
import { StatCard } from "../../components/StatCard";

type StatusCardsProps = {
  totalCount: number;
  paidInvoices: number;
  paidValue: number;
  expiredCount: number;
  pendingInvoices: number;
  pendingValue: number;
  expiredValue: number;
};

const StatusCards = ({
  totalCount,
  paidInvoices,
  paidValue,
  expiredCount,
  pendingInvoices,
  pendingValue,
  expiredValue,
}: StatusCardsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
      <StatCard
        title="Total de NFs"
        value={totalCount.toString()}
        subtitle="Emitidas"
        icon={<FileText size={18} className="text-primary-500" />}
        color="bg-primary-100"
        iconRounded="rounded-lg"
        compact
      />
      <StatCard
        title="Pendentes"
        value={pendingInvoices.toString()}
        subtitle={formatCurrency(pendingValue)}
        icon={<Clock size={18} className="text-warning-text" />}
        color="bg-warning-bg"
        iconRounded="rounded-lg"
        compact
      />
      <StatCard
        title="Pagas"
        value={paidInvoices.toString()}
        subtitle={formatCurrency(paidValue)}
        icon={<CheckCircle2 size={18} className="text-success-text" />}
        color="bg-success-bg"
        iconRounded="rounded-lg"
        compact
      />
      <StatCard
        title="Vencidas"
        value={expiredCount.toString()}
        subtitle={formatCurrency(expiredValue)}
        icon={<XCircle size={18} className="text-danger-text" />}
        color="bg-danger-bg"
        iconRounded="rounded-lg"
        compact
      />
    </div>
  );
};

export default StatusCards;
