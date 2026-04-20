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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Total de NFs"
        value={totalCount.toString()}
        subtitle="Emitidas"
        icon={<FileText size={24} className="text-primary-500" />}
        color="bg-primary-100"
      />
      <StatCard
        title="NFs pendentes"
        value={pendingInvoices.toString()}
        subtitle={formatCurrency(pendingValue)}
        icon={<Clock size={24} className="text-warning-text" />}
        color="bg-warning-bg"
      />
      <StatCard
        title="Pagas"
        value={paidInvoices.toString()}
        subtitle={formatCurrency(paidValue)}
        icon={<CheckCircle2 size={24} className="text-success-text" />}
        color="bg-success-bg"
      />
      <StatCard
        title="Vencidas"
        value={expiredCount.toString()}
        subtitle={formatCurrency(expiredValue)}
        icon={<XCircle size={24} className="text-danger-text" />}
        color="bg-danger-bg"
      />
    </div>
  );
};

export default StatusCards;
