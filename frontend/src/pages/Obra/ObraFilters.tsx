import { ScopeFilterButton } from "../../components/filters/ScopeFilterButton";
import type { ScopeOptions } from "../../components/filters/scope-options";
import { SearchInput } from "../../components/filters/SearchInput";
import type { ScopeFilter } from "../../hooks/useScopeFilter";

interface ObraFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  scopeOptions: ScopeOptions;
  scope: ScopeFilter;
  onScopeChange: (patch: Partial<ScopeFilter>) => void;
}

export function ObraFilters({ search, onSearchChange, scopeOptions, scope, onScopeChange }: ObraFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Buscar por obra, patrimônio, OS, empenho, tipo ou responsável..."
      />
      <ScopeFilterButton options={scopeOptions} value={scope} onChange={onScopeChange} />
    </div>
  );
}
