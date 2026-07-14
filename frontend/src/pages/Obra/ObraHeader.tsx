import { Plus, HardHat, DollarSign } from "lucide-react";
import { formatCurrency } from "../../utils/format-currency";

type ObraHeaderProps = {
  orcamentoTotal: number;
  canCreateAndEditContent: boolean;
  onAdd: () => void;
};

export default function ObraHeader({
  orcamentoTotal,
  canCreateAndEditContent,
  onAdd,
}: ObraHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div>
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <HardHat size={20} className="text-primary-500" />
          Gerenciador de Obras
        </h1>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <p className="text-text-secondary text-xs">
            Controle e acompanhamento em tempo real
          </p>
          <span className="text-text-muted text-xs">·</span>
          <div className="flex items-center gap-1 text-xs">
            <DollarSign size={12} className="text-accent-500" />
            <span className="text-text-secondary">Orçamento total:</span>
            <span className="font-semibold text-text-primary">
              {formatCurrency(orcamentoTotal)}
            </span>
          </div>
        </div>
      </div>

      {canCreateAndEditContent && (
        <button
          onClick={onAdd}
          className="flex cursor-pointer items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors text-sm font-medium shrink-0"
        >
          <Plus size={16} />
          Nova Obra
        </button>
      )}
    </div>
  );
}
