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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <FileText className="text-primary-500" />
          Notas Fiscais
        </h1>
        <div className="flex items-center mt-1">
          <p className="text-text-secondary text-sm">
            Gerencie as notas fiscais emitidas e acompanhe os pagamentos
          </p>

          <span className="text-text-muted">|</span>
          <div className="flex items-center gap-1.5 text-sm">
            <DollarSign size={14} className="text-accent-500" />
            <span className="text-text-secondary">
              Valor total em NF emitidas:
            </span>
            <span className="font-semibold text-text-primary">
              {formatCurrency(totalValue)}
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors text-sm font-medium"
      >
        <Plus size={18} />
        Nova NF
      </button>
    </div>
  );
};

export default Header;
