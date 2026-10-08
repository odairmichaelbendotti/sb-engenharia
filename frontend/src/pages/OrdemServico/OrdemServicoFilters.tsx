import { ArrowDownUp } from "lucide-react";
import { ScopeFilterButton } from "../../components/filters/ScopeFilterButton";
import type { ScopeOptions } from "../../components/filters/scope-options";
import { SearchInput } from "../../components/filters/SearchInput";
import type { ScopeFilter } from "../../hooks/useScopeFilter";

export type OrdemServicoSort = "URGENCY" | "NUMERO" | "SALDO";

const SORT_LABEL: Record<OrdemServicoSort, string> = {
  URGENCY: "Prazo (mais urgentes)",
  NUMERO: "Número (mais recentes)",
  SALDO: "A liquidar (maior)",
};

interface OrdemServicoFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sort: OrdemServicoSort;
  onSortChange: (value: OrdemServicoSort) => void;
  scopeOptions: ScopeOptions;
  scope: ScopeFilter;
  onScopeChange: (patch: Partial<ScopeFilter>) => void;
}

export function OrdemServicoFilters({
  searchTerm,
  onSearchChange,
  sort,
  onSortChange,
  scopeOptions,
  scope,
  onScopeChange,
}: OrdemServicoFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <SearchInput
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Buscar por serviço, OS, empenho, contrato ou empresa..."
      />
      <ScopeFilterButton options={scopeOptions} value={scope} onChange={onScopeChange} />
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
