import { DollarSign, FileText, Plus } from "lucide-react";

type HeaderProps = {
  totalValue: number;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const Header = ({ totalValue, setIsOpen }: HeaderProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div>
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <FileText size={20} className="text-primary-500" />
          Notas Fiscais
        </h1>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <p className="text-text-secondary text-xs">
            Gerencie as notas fiscais emitidas e acompanhe os pagamentos
          </p>
          <span className="text-text-muted text-xs">·</span>
          <div className="flex items-center gap-1 text-xs">
            <DollarSign size={12} className="text-accent-500" />
            <span className="text-text-secondary">Valor total emitido:</span>
            <span className="font-semibold text-text-primary">{formatCurrency(totalValue)}</span>
          </div>
        </div>
      </div>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors text-sm font-medium shrink-0"
      >
        <Plus size={16} />
        Nova Nota Fiscal
      </button>
    </div>
  );
};

export default Header;
