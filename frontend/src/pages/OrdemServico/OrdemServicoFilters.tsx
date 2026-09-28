import { ArrowDownUp, Search } from "lucide-react";

export type OrdemServicoSort = "URGENCY" | "NUMERO" | "VALOR";

const SORT_LABEL: Record<OrdemServicoSort, string> = {
  URGENCY: "Prazo (mais urgentes)",
  NUMERO: "Número (mais recentes)",
  VALOR: "Valor (maior)",
};

interface OrdemServicoFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sort: OrdemServicoSort;
  onSortChange: (value: OrdemServicoSort) => void;
}

export function OrdemServicoFilters({
  searchTerm,
  onSearchChange,
  sort,
  onSortChange,
}: OrdemServicoFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Buscar por OS, empenho, contrato, empresa ou obra..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
        />
      </div>
      <label className="relative sm:w-56">
        <span className="sr-only">Ordenar por</span>
        <ArrowDownUp
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as OrdemServicoSort)}
          className="w-full pl-8 pr-3 py-2 border border-border rounded-lg bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 cursor-pointer"
        >
          {(Object.keys(SORT_LABEL) as OrdemServicoSort[]).map((key) => (
            <option key={key} value={key}>
              {SORT_LABEL[key]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
