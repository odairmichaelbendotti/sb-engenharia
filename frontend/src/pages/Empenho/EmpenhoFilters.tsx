import { ScopeFilterButton } from "../../components/filters/ScopeFilterButton";
import type { ScopeOptions } from "../../components/filters/scope-options";
import { SearchInput } from "../../components/filters/SearchInput";
import type { ScopeFilter } from "../../hooks/useScopeFilter";

interface EmpenhoFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  scopeOptions: ScopeOptions;
  scope: ScopeFilter;
  onScopeChange: (patch: Partial<ScopeFilter>) => void;
}

export function EmpenhoFilters({ searchTerm, onSearchChange, scopeOptions, scope, onScopeChange }: EmpenhoFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <SearchInput value={searchTerm} onChange={onSearchChange} placeholder="Buscar por número, empresa ou descrição..." />
      <ScopeFilterButton options={scopeOptions} value={scope} onChange={onScopeChange} />
    </div>
  );
}
