import { Search, Filter } from "lucide-react";

interface EmpenhoFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function EmpenhoFilters({ searchTerm, onSearchChange }: EmpenhoFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="relative flex-1">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          type="text"
          placeholder="Buscar por número, empresa ou descrição..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </div>
      <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-surface-muted transition-colors text-sm text-text-secondary">
        <Filter size={16} />
        Filtros
      </button>
    </div>
  );
}
