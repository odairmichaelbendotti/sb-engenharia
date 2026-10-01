import { CheckCircle2, Clock, FileText, XCircle, type LucideIcon } from "lucide-react";
import type { InvoiceStatus } from "../../../types/invoice";
import { formatCurrency } from "../../utils/format-currency";

// "" = todas as notas
export type InvoiceStatusFilter = Exclude<InvoiceStatus, "CANCELADO"> | "";

type StatusCardsProps = {
  totalCount: number;
  totalValue: number;
  paidInvoices: number;
  paidValue: number;
  expiredCount: number;
  pendingInvoices: number;
  pendingValue: number;
  expiredValue: number;
  value: InvoiceStatusFilter;
  onChange: (status: InvoiceStatusFilter) => void;
};

type CardConfig = {
  status: InvoiceStatusFilter;
  title: string;
  count: number;
  amount: number;
  icon: LucideIcon;
  iconClass: string;
  iconBg: string;
  activeBorder: string;
};

// Os cards também filtram a tabela: clicar no ativo volta para "todas"
const StatusCards = ({
  totalCount,
  totalValue,
  paidInvoices,
  paidValue,
  expiredCount,
  pendingInvoices,
  pendingValue,
  expiredValue,
  value,
  onChange,
}: StatusCardsProps) => {
  const cards: CardConfig[] = [
    {
      status: "",
      title: "Todas as NFs",
      count: totalCount,
      amount: totalValue,
      icon: FileText,
      iconClass: "text-primary-500",
      iconBg: "bg-primary-100",
      activeBorder: "border-primary-500 ring-primary-200",
    },
    {
      status: "PENDENTE",
      title: "Pendentes",
      count: pendingInvoices,
      amount: pendingValue,
      icon: Clock,
      iconClass: "text-warning-text",
      iconBg: "bg-warning-bg",
      activeBorder: "border-warning-text ring-warning-border",
    },
    {
      status: "PAGO",
      title: "Pagas",
      count: paidInvoices,
      amount: paidValue,
      icon: CheckCircle2,
      iconClass: "text-success-text",
      iconBg: "bg-success-bg",
      activeBorder: "border-success-text ring-success-border",
    },
    {
      status: "VENCIDO",
      title: "Vencidas",
      count: expiredCount,
      amount: expiredValue,
      icon: XCircle,
      iconClass: "text-danger-text",
      iconBg: "bg-danger-bg",
      activeBorder: "border-danger-text ring-danger-border",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
      {cards.map((card) => {
        const active = value === card.status;
        const Icon = card.icon;
        return (
          <button
            key={card.title}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? "" : card.status)}
            className={`bg-surface border rounded-xl px-3 py-2.5 flex items-center gap-3 text-left cursor-pointer transition-all hover:shadow-md ${
              active ? `${card.activeBorder} ring-2` : "border-border"
            }`}
          >
            <div className={`w-8 h-8 ${card.iconBg} rounded-lg flex items-center justify-center shrink-0`}>
              <Icon size={18} className={card.iconClass} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-text-muted leading-none">{card.title}</p>
              <p className="text-base font-bold text-text-primary leading-tight mt-0.5 tabular-nums">{card.count}</p>
              <p className="text-xs text-text-muted leading-none mt-0.5 truncate tabular-nums">
                {formatCurrency(card.amount)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default StatusCards;
