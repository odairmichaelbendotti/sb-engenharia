import { Plus, Building2 } from "lucide-react";

type CompanyHeaderProps = {
  canCreateAndEditContent: boolean;
  onAdd: () => void;
};

export default function CompanyHeader({
  canCreateAndEditContent,
  onAdd,
}: CompanyHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div>
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Building2 size={20} className="text-primary-500" />
          Empresas
        </h1>
        <p className="text-text-secondary text-xs mt-0.5">
          Gerencie as empresas cadastradas e seus empenhos
        </p>
      </div>
      {canCreateAndEditContent && (
        <button
          onClick={onAdd}
          className="flex items-center cursor-pointer text-white justify-center gap-2 px-4 py-2 bg-primary-500 rounded-md hover:bg-primary-600 transition-colors text-sm font-medium shrink-0"
        >
          <Plus size={16} />
          Nova Empresa
        </button>
      )}
    </div>
  );
}
