import { ArrowDownUp } from "lucide-react";
import { ScopeFilterButton } from "../../components/filters/ScopeFilterButton";
import type { ScopeOptions } from "../../components/filters/scope-options";
import { SearchInput } from "../../components/filters/SearchInput";
import { Select } from "../../components/ui";
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
      <Select
        size="sm"
        icon={ArrowDownUp}
        aria-label="Ordenar por"
        value={sort}
        onChange={(e) => onSortChange(e.target.value as OrdemServicoSort)}
        className="sm:w-52"
      >
        {(Object.keys(SORT_LABEL) as OrdemServicoSort[]).map((key) => (
          <option key={key} value={key}>
            {SORT_LABEL[key]}
          </option>
        ))}
      </Select>
    </div>
  );
}
