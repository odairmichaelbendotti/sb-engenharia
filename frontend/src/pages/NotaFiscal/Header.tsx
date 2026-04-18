import { Plus, FileText } from "lucide-react";
import Breadcrumb from "../../components/Breadcrumb";

interface HeaderProps {
  onAddClick: () => void;
}

export function Header({ onAddClick }: HeaderProps) {
  return (
    <>
      <Breadcrumb current="Notas Fiscais" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FileText className="text-primary-500" />
            Notas Fiscais
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Gerencie as notas fiscais emitidas e acompanhe os pagamentos
          </p>
        </div>
        <button
          onClick={onAddClick}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          Nova NF
        </button>
      </div>
    </>
  );
}
